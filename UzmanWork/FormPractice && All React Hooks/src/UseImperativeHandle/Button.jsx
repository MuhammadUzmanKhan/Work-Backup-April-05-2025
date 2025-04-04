import { forwardRef, useImperativeHandle, useState } from "react";
// eslint-disable-next-line react/display-name
const Button = forwardRef((_props, ref) => {
  const [toggle, setToggle] = useState(false);
  useImperativeHandle(ref, () => ({
    alterToggle() {
      setToggle(!toggle);
    },
  }));
  return (
    <>
      <button>Button from Child</button>
      {toggle && <span>..Toggle</span>}
    </>
  );
});

export default Button;
