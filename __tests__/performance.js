let SLOT_TOKEN = "@@hta";
let PATTERN = /(?:<\/?[^\s>]+|@@hta|>)/g;
let TEMPLATE_ELEMENT = "template";
let SLOT_ATTRIBUTE = "hta-slot";
let PLACEHOLDER = Symbol("placeholder");
let DIRECTIVE = Symbol("directive");
let tagNamePattern = /^[a-z0-9_-]+/i;

function parseTemplate1(parts) {
  let id = Symbol();
  if (parts.length === 1)
    return { id, html: parts[0], query: null, slots: EMPTY_ARRAY };

  let slots = [];
  let html = [];
  let query = [];
  // unknown = 0, openTag = 1, singleQuote = 2, doubleQuote = 3
  let current = 0;
  let matches = [...parts.join(SLOT_TOKEN).matchAll(PATTERN)];
  while (matches.length) {
    let [match] = matches.shift();
    switch (match[0]) {
      case "<":
        current = match[1] === "/" ? 0 : 1;
        break;
      case ">":
        current = 0;
        break;
      case "@":
        let attr = `hta-${slots.length}`;
        query.push(`[${attr}="1"]`);
        html.push(
          current === 1
            ? ` ${attr}="1" `
            : `<${TEMPLATE_ELEMENT} ${SLOT_ATTRIBUTE}="1" ${attr}="1"></${TEMPLATE_ELEMENT}>`
        );
        slots[slots.length] = current === 1 ? DIRECTIVE : PLACEHOLDER;
        break;
    }
  }
  return {
    id,
    html: parts.reduce(
      (prev, current, index) => prev + html[index - 1] + current
    ),
    query: query.join(","),
    slots,
  };
}

function parseTemplate2(parts) {
  if (parts.length === 1) return [parts[0], null, EMPTY_ARRAY];
  let slots = [];
  let html = [];
  let query = [];
  // unknown = 0, openTag = 1, singleQuote = 2, doubleQuote = 3
  let current = 0;

  function push(str) {
    if (!str) return;
    let i;
    if (!current) {
      // find open tag char
      i = str.indexOf("<");
      if (i === -1) {
        html.push(str);
        return;
      }
      html.push(str.substr(0, i + 1));
      str = str.substr(i + 1);
      let isClose = false;
      // is close tag
      if (str[0] === "/") {
        html.push("/");
        isClose = true;
        str = str.substr(1);
      }

      let result = tagNamePattern.exec(str);

      if (!result || (isClose && str[result[0].length] !== ">")) {
        throw new Error(`HTML is not well formed`);
      }
      current = isClose ? 0 : 1;
      html.push(result[0]);
      if (isClose) html.push(">");
      return push(str.substr(result[0].length + (isClose ? 1 : 0)));
    }
    if (current === 1) {
      let result = /['">]/.exec(str);
      // not found
      if (!result) {
        html.push(str);
        return;
      }
      if (result[0] === '"') {
        current = 3;
      } else if (result[0] === "'") {
        current = 2;
      } else {
        current = 0;
      }
      html.push(str.substr(0, result.index + 1));
      return push(str.substr(result.index + 1));
    }
    let result = str.indexOf(current === 2 ? "'" : '"');
    if (result === -1) {
      html.push(str);
      return;
    }
    current = 1;
    html.push(str.substr(0, result + 1));
    return push(str.substr(result + 1));
  }
  push(parts[0]);

  let length = parts.length - 1;
  for (let i = 0; i < length; i++) {
    if (current > 1)
      throw new Error("Cannot embed binding inside attribute values. ");
    slots[i] = current === 1 ? DIRECTIVE : PLACEHOLDER;
    let attr = `hta-${i}`;
    html.push(
      current === 1
        ? ` ${attr}="1" `
        : `<${TEMPLATE_ELEMENT} ${SLOT_ATTRIBUTE}="1" ${attr}="1"></${TEMPLATE_ELEMENT}>`
    );
    query[i] = `[${attr}="1"]`;
    push(parts[i + 1]);
  }
  return [html.join(""), query.join(","), slots];
}

test("p1", () => {
  let s = Date.now();
  parseTemplate1(["", "<a>", "<span>before ", " after</span>", "</a>"]);
  console.log(Date.now() - s);

  s = Date.now();
  parseTemplate2(["", "<a>", "<span>before ", " after</span>", "</a>"]);
  console.log(Date.now() - s);
});
