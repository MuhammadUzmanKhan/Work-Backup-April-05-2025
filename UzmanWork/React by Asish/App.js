const heading = document.createElement(
  "h1",
  { id: heading, xyz: "abc" },
  "hello world react"
);
console.log(heading);
const root = React.createRoot(document.getElementsById("root"));
root.render(heading);
