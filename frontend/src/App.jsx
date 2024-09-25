import { useEffect, useState } from "react";
import "./App.css";

import { AppService } from "../bindings/palclip";
import { Events, WML } from "@wailsio/runtime";
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
  Link,
  useToast
} from "@chakra-ui/react";

import {
  SettingsIcon,
  LockIcon,
  ExternalLinkIcon,
  CopyIcon
} from "@chakra-ui/icons";

function App() {
  const toast = useToast();
  const [clipList, setClipList] = useState([]);
  const [filteredData, setFilteredData] = useState([]);

  const updateClipList = (result) => {
    const res = JSON.parse(result);
    setClipList(res);
    setFilteredData(res)
  };

  function filterByString(arr, searchString, key) {
    if (!searchString) {
      return arr;
    }
    return arr.filter((obj) =>
      obj[key].toLowerCase().includes(searchString.toLowerCase())
    );
  }
  const handleFilterChange = (e) => {
    const newList = filterByString(clipList, e.target.value, "content");
    setFilteredData(newList);
  };

  useEffect(() => {
    clipData();
  }, []);

  function clipData() {
    AppService.GetClipData("none").then(updateClipList);
    const onCopyEvent = (message) => {
      console.log("onCopyEvent.message ", message);
      AppService.GetClipData("none").then(updateClipList);
    };
    Events.On("copy_event", onCopyEvent);
  }

  function copyItem(e, itemContent) {
    e.preventDefault();
    console.log("copyItem...");
    AppService.CopyItemContent(itemContent);
    Events.Emit(
      { name: "window_hide", data: true });
    toast({ description: "Copied!", duration: 500 });
    return false;
  }

  function markSecret(e, item) {
    e.preventDefault();
    console.log("markSecret...");
    Events.Emit({ name: "mark_secret", data: item.hash });
    toast({ description: "Marked secret!", duration: 500 });
    window.location.reload()
    return false;
  }

  function quit(e) {
    e.preventDefault();
    console.log("quit...");
    Events.Emit(
      { name: "menu_quit", data: true });
    return false;
  }

  function settings(e) {
    e.preventDefault();
    console.log("settings...");
    Events.Emit(
      { name: "menu_settings", data: true});
    return false;
  }

  function clear(e) {
    e.preventDefault();
    console.log("clear...");
    Events.Emit(
      { name: "menu_clear", data: true});
    return false;
  }

  function about(e) {
    e.preventDefault();
    console.log("about...");
    toast({
      render: () => (
        <Card>
          <CardBody>
            <Text> Cross platform clipboard manager</Text>
            <Link href="https://github.com/techierishi" isExternal>
              techierishi <ExternalLinkIcon mx="2px" />
            </Link>
          </CardBody>
        </Card>
      ),
      duration: 4000,
      isClosable: true
    });
    return false;
  }

  function clearStr(item) {
    if(item.is_secret){
      return "**********"
    }

    let str = item.content
    if (str) {
      str = str.trim();
      return str.slice(0, 40) + "...";
    }
    return str;
  }

  return (
    <div id="pal-app">
      <Card>
        <CardHeader style={{ padding: "5px" }}>
          <Flex>
            <Input
              className="search-input"
              placeholder="search"
              onChange={handleFilterChange}
              size="sm"
            />
            <Menu>
              <MenuButton
                size="sm"
                as={IconButton}
                aria-label="Settings"
                icon={<SettingsIcon />}
                style={{ marginLeft: "5px" }}
                variant="outline"
              />
              <MenuList>
                <MenuItem onClick={(e) => clear(e)}>Clear</MenuItem>
                <MenuItem onClick={(e) => settings(e)}>Preference</MenuItem>
                <MenuItem onClick={(e) => about(e)}>About</MenuItem>
                <MenuItem onClick={(e) => quit(e)}>Quit</MenuItem>
              </MenuList>
            </Menu>
          </Flex>
        </CardHeader>

        <CardBody style={{ padding: "10px" }}>
          <Stack spacing="2">
            {filteredData.map((itm) => (
              <Box key={itm.hash}>
                <Flex>
                  <Text
                    pt="2"
                    fontSize="sm"
                    flex="1"
                    style={{ textAlign: "left" }}
                  >
                    {clearStr(itm)}
                  </Text>
                  <Text pt="2" fontSize="xs" color="#cccccc">
                    {new Date(itm.timestamp).toISOString()}
                  </Text>

                  <IconButton
                    colorScheme="teal"
                    variant="warning"
                    aria-label="Secret"
                    size="sm"
                    icon={<LockIcon color={"teal"} />}
                    onClick={(e) => markSecret(e, itm)}
                  >
                    Secret
                  </IconButton>

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
