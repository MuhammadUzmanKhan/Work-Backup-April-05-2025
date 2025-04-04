import React from 'react';
import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import PropTypes from 'prop-types';

import { setStateValue } from 'store/reducers/user';

const Timer = ({ initialSeconds = 0 }) => {
  const dispatch = useDispatch();
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    let myInterval = setInterval(() => {
      if (seconds > 0) {
        setSeconds(seconds - 1);
      }
      if (seconds === 0) {
        clearInterval(myInterval);
        dispatch(setStateValue({ type: 'deadlineStart', data: false }));
      }
    }, 1000);
    return () => {
      clearInterval(myInterval);
    };
  });

  return <>{seconds ? <span>({seconds} sec)</span> : null}</>;
};

export default Timer;

Timer.propTypes = {
  initialSeconds: PropTypes.number
};
