import { varTranEnter, varTranExit } from '@/components/animate/variants/transition';

export const varRotate = (props) => {
  const durationIn = props?.durationIn;
  const durationOut = props?.durationOut;
  const easeIn = props?.easeIn;
  const easeOut = props?.easeOut;

  return {
    in: {
      initial: { opacity: 0, rotate: -360 },
      animate: {
        opacity: 1,
        rotate: 0,
        transition: varTranEnter({ durationIn, easeIn }),
      },
      exit: {
        opacity: 0,
        rotate: -360,
        transition: varTranExit({ durationOut, easeOut }),
      },
    },

    out: {
      initial: { opacity: 1, rotate: 0 },
      animate: {
        opacity: 0,
        rotate: -360,
        transition: varTranExit({ durationOut, easeOut }),
      },
    },
  };
};
