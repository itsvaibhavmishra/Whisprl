import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { CreateAccountKey, PrepareEncryption } from "@/redux/slices/actions/encryptionActions";
import { setUnlockOpen } from "@/redux/slices/encryptionSlice";
import RecoveryKeyDialog from "@/sections/encryption/RecoveryKeyDialog";
import UnlockDialog from "@/sections/encryption/UnlockDialog";

const EncryptionGate = () => {
  const dispatch = useDispatch();
  const { status, unlockOpen } = useSelector((state) => state.encryption);
  const [recoveryKey, setRecoveryKey] = useState(null);
  const creatingKey = useRef(false);

  const createKey = async () => {
    const result = await dispatch(CreateAccountKey());
    if (CreateAccountKey.fulfilled.match(result)) setRecoveryKey(result.payload.recoveryKey);
    else dispatch(PrepareEncryption());
  };

  useEffect(() => {
    if (status !== "setup" || creatingKey.current) return;
    creatingKey.current = true;
    createKey().finally(() => {
      creatingKey.current = false;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  if (recoveryKey) {
    return <RecoveryKeyDialog recoveryKey={recoveryKey} onDone={() => setRecoveryKey(null)} />;
  }

  if (status === "locked" && unlockOpen) {
    return <UnlockDialog onLater={() => dispatch(setUnlockOpen(false))} onStartFresh={createKey} />;
  }

  return null;
};

export default EncryptionGate;
