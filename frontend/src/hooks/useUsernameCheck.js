import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";

import { CheckUsername } from "@/redux/slices/actions/userActions";

const CHECK_PAUSE_MS = 400;

const normalizedUsername = (value) => value.trim().replace(/^@/, "").toLowerCase();

// the server holds the rules and knows what is taken, so it is asked once typing pauses
const useUsernameCheck = (draft, current) => {
  const dispatch = useDispatch();
  const [check, setCheck] = useState({ username: current, problem: null });
  const wanted = normalizedUsername(draft);
  const isUnchanged = !wanted || wanted === current;
  const isChecked = check.username === wanted;

  useEffect(() => {
    if (isUnchanged) return;
    const timer = setTimeout(async () => {
      const result = await dispatch(CheckUsername(wanted));
      if (CheckUsername.fulfilled.match(result)) setCheck(result.payload);
    }, CHECK_PAUSE_MS);
    return () => clearTimeout(timer);
  }, [dispatch, wanted, isUnchanged]);

  const isFree = !isUnchanged && isChecked && !check.problem;
  const problem = !isUnchanged && isChecked ? check.problem : null;
  const status = () => {
    if (isUnchanged) return null;
    if (!isChecked) return "Checking…";
    return problem ?? `@${wanted} is free`;
  };

  return { wanted, isUnchanged, isFree, problem, status: status() };
};

export default useUsernameCheck;
