import { useEffect, useState } from "react";
import "./App.css";

import {AppService} from "../bindings/palclip";
import {Events, WML} from "@wailsio/runtime";
import {
  Card,
  CardHeader,
  CardBody,
  Input,
  Text,
  Stack,
  Box,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  Flex, 
} from "@chakra-ui/react";

import { SettingsIcon, CopyIcon } from "@chakra-ui/icons";

function App() {
  const [filterValue, setFilterValue] = useState("");

  const [clipList, setClipList] = useState([]);
  const updateClipList = (result) => {
    const res = JSON.parse(result);
    // console.log(res);
    setClipList(res);
  };

  const [currentTime, setCurrentTime] = useState(null);

  function globalHotkeyEventHandler(time) {
    setCurrentTime(time);
    const win = window;
    win.runtime.WindowShow();
  }

  const handleFilterChange = (filterValue) =>
    window.setTimeout(() => setFilterValue(filterValue), 10);

  useEffect(() => {
    Events.On("Backend:GlobalHotkeyEvent", globalHotkeyEventHandler);
    clipData();
  }, []);

  function clipData() {
    AppService.GetClipData("none").then(updateClipList);
    const onCopyEvent = (message) => {
      console.log("onCopyEvent.message ", message);
      AppService.GetClipData("none").then(updateClipList);
    };
    Events.On("copyEvent", onCopyEvent);
  }

  function copyItem(e, itemContent) {
    e.preventDefault();
    console.log("copyItem...");
    AppService.CopyItemContent(itemContent);
    const win = window;
    win.runtime.WindowHide();
    return false;
  }

  function clearStr(str) {
    if (str) {
      str = str.trim();
      return str.slice(0, 40) + "...";
    }
    return str;
  }

  return (
    <div id="pal-app">
      <Card>
        <CardHeader style={{padding: "5px"}}>
        <Flex>
          <Input className="search-input" placeholder="search" size="sm" />
          <Menu>
            <MenuButton
               size='sm'
              as={IconButton}
              aria-label="Settings"
              icon={<SettingsIcon />}
              style={{marginLeft: "5px"}}
              variant="outline"
            />
            <MenuList>
              <MenuItem>Clear</MenuItem>
              <MenuItem>Preference</MenuItem>
              <MenuItem>About</MenuItem>
              <MenuItem>Quit</MenuItem>
            </MenuList>
          </Menu>
          </Flex>
        </CardHeader>

        <CardBody style={{padding: "10px"}}>
          <Stack spacing="2">
            {clipList.map((itm) => (
              <Box>
                <Flex>
                  <Text pt="2" fontSize="sm" flex='1' style={{textAlign: "left"}}>
                    {" "}
                    {clearStr(itm.content)}{" "}
                  </Text>
                  <IconButton
                    colorScheme="teal"
                    variant="ghost"
                    aria-label="Copy"
                    size="sm"
                    icon={<CopyIcon />}
                    onClick={(e) => copyItem(e, itm.content)}
                  >
                    Copy
                  </IconButton>
                  
                </Flex>
              </Box>
            ))}
          </Stack>
        </CardBody>
      </Card>
    </div>
  );
}

export default App;
