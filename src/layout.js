import { h, Component } from "preact";
import { CopyButton } from "./copy-button";
// import sample1 from "./sample1";
// import sample2 from "./sample2";

const routeLineRE = /^[└├┌] /;
const summaryLineRE = /^  [├└]/;
const spacesRE = / {2,}/;

const toObject = (arrayOfLineArrays) => {
  const result = {};
  arrayOfLineArrays.forEach((lineArray) => {
    const entry = { first: lineArray[1] };
    const second = lineArray[2];

    if (second) {
      entry.second = second;
    }
    result[lineArray[0]] = entry;
  });
  return result;
};

const parse = (stuff = "") => {
  const trimmed = stuff ? stuff.trim() : "";

  const lines = trimmed.split("\n");
  const sharedByAllLine = lines
    .find((line) => line.startsWith("+ "))
    .split(spacesRE)[1];
  const routeLines = toObject(
    lines
      .filter((line) => routeLineRE.test(line))
      .map((line) => line.slice(4).split(spacesRE))
  );
  const summaryLines = lines
    .filter((line) => summaryLineRE.test(line))
    .map((line) => {
      const split = line.split(spacesRE);
      return [split[1].slice(2), split[2]];
    });

  return { routeLines, sharedByAllLine, summaryLines };
};

const isIdentical = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const compare = (obj1, obj2) => {
  const unchanged = {};
  const changed = {};
  const removed = {};
  const added = {};
  const inBoth = {};

  for (const key in obj1) {
    const val1 = obj1[key];
    const val2 = obj2[key];
    if (!val2) {
      removed[key] = val1;
    }
    if (val1 && val2) {
      inBoth[key] = true;
      if (isIdentical(val1, val2)) {
        unchanged[key] = val1;
      } else {
        changed[key] = {
          before: val1,
          after: val2,
        };
      }
    }
  }

  for (const key in obj2) {
    const val1 = obj1[key];
    const val2 = obj2[key];
    if (!val1) {
      added[key] = val2;
    }
  }

  return { changed };
};

const formatEntry = ({ label = "", first, second }) =>
  `${label.padEnd(40, " ")} ${first.padStart(10, " ")} ${second.padStart(
    10,
    " "
  )}`;

export default class extends Component {
  constructor(props) {
    super(props);
    this.state = {
      one: "",
      two: "",
      output: "",
    };

    this.computeResult = this.computeResult.bind(this);
    this.handleChanged = this.handleChanged.bind(this);
  }

  handleChanged() {
    const beforeEl = this.base && this.base.querySelector("[name=before]");
    const afterEl = this.base && this.base.querySelector("[name=after]");

    this.setState(
      {
        one: (beforeEl && beforeEl.value) || "",
        two: (afterEl && afterEl.value) || "",
      },
      this.computeResult
    );
  }

  computeResult() {
    const { one, two, output } = this.state;
    if (!one || !two) {
      if (output) {
        return this.setState({ output: "" });
      }
      return;
    }

    const first = parse(one);
    const second = parse(two);

    const result = [];

    if (!isIdentical(first.sharedByAllLine, second.sharedByAllLine)) {
      result.push("Changed shared by all total:");
      result.push(first.sharedByAllLine, second.sharedByAllLine, "\n");
      if (!isIdentical(first.summaryLines, second.summaryLines)) {
        result.push("First load JS shared by all changes:");
        console.log(first.summaryLines, second.summaryLines);
        const length = Math.max(
          first.summaryLines.length,
          second.summaryLines.length
        );
        for (let i = 0; i < length; i++) {
          const before = first.summaryLines[i];
          const after = second.summaryLines[i];
          result.push(
            `${(before[0] || "").padEnd(35, " ")} ${(before[1] || "").padEnd(
              10,
              " "
            )} ${(after[0] || "").padEnd(35, " ")} ${(after[1] || "").padEnd(
              10,
              " "
            )}`
          );
        }
      } else {
        result.push("First load JS shared by all is unchanged\n");
      }
    } else {
      result.push(
        `Shared by all total is unchanged at: ${first.sharedByAllLine}\n`
      );
    }

    if (!isIdentical(first.routeLines, second.routeLines)) {
      const { changed } = compare(first.routeLines, second.routeLines);
      const keys = Object.keys(changed);

      if (keys.length) {
        result.push("Changed routes:");
        result.push(
          ...keys.map((key) => {
            const changes = changed[key];
            return (
              formatEntry({
                label: key,
                first: changes.before.first,
                second: changes.before.second,
              }) +
              "\n" +
              formatEntry({
                first: changes.after.first,
                second: changes.after.second,
              }) +
              "\n"
            );
          })
        );
      }
    }

    this.setState({ output: result.join("\n") });
  }

  render() {
    const { output } = this.state;

    return (
      <main className="pa3">
        <div className="mw7 center">
          <h1>Next.js Build Output differ</h1>
          <div>
            <p>Paste in the "before" output</p>
            <textarea
              className="w-100 h4"
              name="before"
              onChange={this.handleChanged}
              onPaste={this.handleChanged}
            />
          </div>
          <div>
            <p>Paste in the "after" output</p>
            <textarea
              className="w-100 h4"
              name="after"
              onChange={this.handleChanged}
              onPaste={this.handleChanged}
            />
          </div>
          <div>
            {!output && <div>(Output will appear here)</div>}
            {output && (
              <div>
                <div>{output && <CopyButton text={output} />}</div>
                <pre className="f6">{output}</pre>
              </div>
            )}
          </div>
        </div>
      </main>
    );
  }
}
