import { useSelector } from "react-redux";

import { selectHasSettled } from "@/redux/slices/requestSlice";

const useHasSettled = (thunk) => useSelector((state) => selectHasSettled(state, thunk));

export default useHasSettled;
