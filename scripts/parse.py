#!/usr/bin/env python3
"""Parse the GBK-encoded Taiwan 7000-word reference list into clean JSON.

Source: mahavivo/english-wordlists  台灣高中英文參考詞彙表.txt (educational use)
Output: src/data/words.json  —  [{id, w, pos, zh, lvl}]
  lvl 1 = 學測核心 4000 (non-starred), lvl 2 = 指考進階 7000 (starred)

Strategy: split each line at the first CJK char. Left part = headword + POS,
right part = Chinese gloss. Robust to OCR noise in the POS field.
"""
import re, json, os, sys

RAW = os.path.join(os.path.dirname(__file__), "raw", "tw7000.raw.txt")
data = open(RAW, "rb").read().decode("gb18030")
lines = [l.rstrip() for l in data.split("\n")]

CJK = re.compile(r"[一-鿿]")
POS_CANON = {
    "n": "n.", "v": "v.", "vt": "vt.", "vi": "vi.", "adj": "adj.", "adv": "adv.",
    "prep": "prep.", "conj": "conj.", "pron": "pron.", "art": "art.", "aux": "aux.",
    "int": "int.", "abbr": "abbr.", "phr": "phr.", "a": "adj.", "ad": "adv.",
}

def clean_pos(raw):
    # raw is the chunk between headword and first CJK; e.g. "n./v." , "nJv." , "adj " , "、"
    raw = raw.replace("J", "/").replace("、", ".").replace("，", "/")
    toks = re.findall(r"[a-zA-Z]+", raw)
    out = []
    for t in toks:
        t = t.lower()
        if t in POS_CANON and POS_CANON[t] not in out:
            out.append(POS_CANON[t])
    return "/".join(out)

words = []
skipped = []
for l in lines:
    s = l.strip()
    if not s:
        continue
    if re.match(r"^[A-Z]$", s):
        continue
    if "4000" in s and "7000" in s:
        continue
    star = s.startswith("*")
    body = s.lstrip("*").strip()

    m = CJK.search(body)
    if not m:
        skipped.append(s)
        continue
    left = body[:m.start()].strip()
    zh = body[m.start():].strip()

    # left = headword + pos.  Headword starts with a letter; pos chars are the
    # trailing [a-z./() ] cluster. Pull headword = leading run that looks like a
    # word/phrase, pos = the rest.
    # Heuristic: headword is letters/space/hyphen/apostrophe; once we hit a lone
    # short pos-token after a space (or "(") treat remainder as pos.
    lm = re.match(r"^([A-Za-z][A-Za-z' -]*?)(?:\s*\((\d)\))?\s+([a-zA-Z./()，、J ]+)$", left)
    if lm:
        head = lm.group(1).strip()
        pos = clean_pos(lm.group(3))
    else:
        # no separable pos (e.g. "analyze" then "、分析"): whole left is head
        head = re.sub(r"\s*\(\d\)\s*$", "", left).strip()
        pos = ""

    head = head.strip().strip(".").strip()
    zh = zh.strip().lstrip("、,./").strip()
    if not head or not zh or not re.match(r"^[A-Za-z]", head):
        skipped.append(s)
        continue
    words.append({"w": head, "pos": pos, "zh": zh, "star": star})

# merge duplicates (homographs / repeated headwords): combine pos + zh
merged = {}
order = []
for w in words:
    k = w["w"].lower()
    if k not in merged:
        merged[k] = {"w": w["w"], "pos": w["pos"], "zh": w["zh"], "star": w["star"]}
        order.append(k)
    else:
        e = merged[k]
        if w["zh"] not in e["zh"]:
            e["zh"] = e["zh"] + "；" + w["zh"]
        if w["pos"] and w["pos"] not in e["pos"]:
            e["pos"] = (e["pos"] + "/" + w["pos"]).strip("/")
        e["star"] = e["star"] and w["star"]  # if any sense is core, treat as core

out = [merged[k] for k in order]

print("parsed:", len(words), " unique:", len(out))
print("core(4000):", sum(1 for w in out if not w["star"]))
print("adv (7000):", sum(1 for w in out if w["star"]))
print("no-pos:", sum(1 for w in out if not w["pos"]))
print("skipped:", len(skipped))
for x in skipped[:20]:
    print("  SKIP:", repr(x))
print("--- samples ---")
for w in out[:6]:
    print(" ", w)

if len(sys.argv) > 1 and sys.argv[1] == "--write":
    final = [{"id": i, "w": w["w"], "pos": w["pos"], "zh": w["zh"],
              "lvl": 2 if w["star"] else 1} for i, w in enumerate(out)]
    outdir = os.path.join(os.path.dirname(__file__), "..", "src", "data")
    os.makedirs(outdir, exist_ok=True)
    p = os.path.join(outdir, "words.json")
    json.dump(final, open(p, "w", encoding="utf-8"), ensure_ascii=False)
    print("WROTE", p, len(final), "words")
