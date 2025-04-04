const jsonfile = require("jsonfile");
const moment = require("moment");
const simpleGit = require("simple-git");

const FILE_PATH = "./data.json";

const makeCommit = async (n) => {
  if (n === 0) return simpleGit().push();

  let random;
  try {
    random = require("random");
  } catch (err) {
    if (err.code === "ERR_REQUIRE_ESM") {
      random = (await import("random")).default;
    } else {
      throw err;
    }
  }

  const x = random.int(0, 54);
  const y = random.int(0, 6);
  const DATE = moment()
    .subtract(1, "y")
    .add(1, "d")
    .add(x, "w")
    .add(y, "d")
    .format();

  const data = {
    date: DATE,
  };

  console.log(DATE);
  jsonfile.writeFile(FILE_PATH, data, () => {
    simpleGit()
      .add([FILE_PATH])
      .commit(DATE, `'date': ${DATE}`, makeCommit.bind(this, --n));
  });
};

makeCommit(100);
