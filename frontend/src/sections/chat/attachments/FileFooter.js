import { useState } from "react";
import { Box, ButtonBase, IconButton, InputBase, Stack, Tooltip } from "@mui/material";
import { NumberCircleOne, PaperPlaneTilt, Plus, X } from "phosphor-react";
import { useDispatch, useSelector } from "react-redux";

import { ChooseAttachments, RemoveAttachment, SendAttachments } from "@/redux/slices/actions/attachmentActions";
import { setActiveFileIndex } from "@/redux/slices/chatSlice";
import { COLUMN_WIDTH, COMPOSER_GUTTER, FIELD_PILL, ROUND_BUTTON } from "@/sections/chat/conversation/Composer";
import { MAX_ATTACHMENTS, attachmentUrl } from "@/utils/attachments";

const TILE = { position: "relative", width: 56, height: 56, flexShrink: 0, borderRadius: 1.5, overflow: "hidden" };

const Thumbnail = ({ file, isActive, onPick, onRemove }) => (
  <Box sx={{ position: "relative", flexShrink: 0 }}>
    <ButtonBase
      onClick={onPick}
      aria-label={`Preview ${file.fileName}`}
      aria-pressed={isActive}
      sx={{ ...TILE, boxShadow: (theme) => (isActive ? `0 0 0 2.5px ${theme.palette.primary.main}` : `0 0 0 1px ${theme.palette.divider}`) }}
    >
      {file.kind === "image" || file.preview ? (
        <Box component="img" src={file.kind === "image" ? attachmentUrl(file.id) : file.preview} alt="" sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <Box sx={{ width: "100%", height: "100%", display: "grid", placeItems: "center", bgcolor: "chat.raised", fontSize: 11, fontWeight: 800, color: "primary.main" }}>
          {file.typeLabel}
        </Box>
      )}
    </ButtonBase>
    <IconButton
      size="small"
      aria-label={`Remove ${file.fileName}`}
      onClick={onRemove}
      sx={{ position: "absolute", top: -6, right: -6, width: 24, height: 24, color: "common.white", bgcolor: "rgba(6, 12, 22, 0.7)", "&:hover": { bgcolor: "error.main" } }}
    >
      <X size={12} weight="bold" />
    </IconButton>
  </Box>
);

const FileFooter = () => {
  const dispatch = useDispatch();
  const { files, activeFileIndex } = useSelector((state) => state.chat);
  const [caption, setCaption] = useState("");
  const [isViewOnce, setIsViewOnce] = useState(false);
  const canBeViewOnce = files.length === 1 && files[0].kind !== "doc";
  const sendsViewOnce = isViewOnce && canBeViewOnce;

  // a view-once photo goes without a caption, which would stay in the chat after the photo is gone
  const handleSend = () => {
    dispatch(SendAttachments(sendsViewOnce ? undefined : caption.trim() || undefined, sendsViewOnce));
    setCaption("");
  };

  return (
    <Box sx={COMPOSER_GUTTER}>
      <Stack spacing={1.5} sx={{ maxWidth: COLUMN_WIDTH, mx: "auto" }}>
        <Stack direction="row" spacing={1.25} alignItems="center" sx={{ overflowX: "auto", p: 0.75 }} className="scrollbar">
          {files.map((file, index) => (
            <Thumbnail
              key={file.id}
              file={file}
              isActive={index === activeFileIndex}
              onPick={() => dispatch(setActiveFileIndex(index))}
              onRemove={() => dispatch(RemoveAttachment(file.id))}
            />
          ))}
          {files.length < MAX_ATTACHMENTS && (
            <Tooltip title="Add more">
              <ButtonBase
                aria-label="Add more files"
                onClick={() => dispatch(ChooseAttachments())}
                sx={{ ...TILE, color: "text.secondary", border: 2, borderStyle: "dashed", borderColor: "divider", bgcolor: "chat.pill", "&:hover": { color: "primary.main", borderColor: "primary.main" } }}
              >
                <Plus size={22} weight="bold" />
              </ButtonBase>
            </Tooltip>
          )}
        </Stack>

        <Stack direction="row" alignItems="flex-end" sx={{ gap: 1 }}>
          <Stack direction="row" alignItems="center" sx={{ ...FIELD_PILL, minHeight: 48, px: 0.5 }}>
            {canBeViewOnce && (
              <Tooltip title={sendsViewOnce ? "View once is on" : "View once"}>
                <IconButton
                  aria-label="View once"
                  aria-pressed={sendsViewOnce}
                  onClick={() => setIsViewOnce((isOn) => !isOn)}
                  sx={{ color: sendsViewOnce ? "primary.main" : "text.secondary" }}
                >
                  <NumberCircleOne size={22} weight={sendsViewOnce ? "fill" : "regular"} />
                </IconButton>
              </Tooltip>
            )}
            <InputBase
              placeholder={sendsViewOnce ? "View once has no caption" : "Add a caption..."}
              disabled={sendsViewOnce}
              value={sendsViewOnce ? "" : caption}
              onChange={(event) => setCaption(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  handleSend();
                }
              }}
              inputProps={{ "aria-label": "Caption" }}
              sx={{ flex: 1, minWidth: 0, px: canBeViewOnce ? 0.5 : 1.5, py: "12px", fontSize: 15, fontWeight: 500 }}
            />
          </Stack>
          <IconButton aria-label="Send" onClick={handleSend} disabled={files.length === 0} sx={ROUND_BUTTON}>
            <PaperPlaneTilt size={21} weight="fill" />
          </IconButton>
        </Stack>
      </Stack>
    </Box>
  );
};

export default FileFooter;
