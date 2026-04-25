import { Container, Stack } from "@mui/material";
import { Outlet } from "react-router-dom";

import Logo from "../../assets/icons/logo/Whisprl.png";

const DocsLayout = () => {
  return (
    <Container sx={{ pt: 5 }} maxWidth="sm">
      <Stack spacing={5}>
        <Stack
          direction={"column"}
          alignItems={"center"}
          sx={{ width: "100%" }}
        >
          <Stack
            component={"img"}
            src={Logo}
            alt={"Whisprl Logo"}
            sx={{ height: 120, width: 120 }}
          />
        </Stack>
      </Stack>

      <Outlet />
    </Container>
  );
};

export default DocsLayout;
