import { useEffect, useState, useRef } from "react";
import "./App.css";
import { GetClipData, CopyItemContent } from "../wailsjs/go/main/App";

import { EventsOn, EventsEmit } from "../wailsjs/runtime/runtime";
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
  Button,
  Flex,
  Link,
  useToast,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Textarea,
  Tag
} from "@chakra-ui/react";

import {
  HamburgerIcon,
  LockIcon,
  ExternalLinkIcon,
  CopyIcon
} from "@chakra-ui/icons";

function App() {
  const toast = useToast();
  const [clipList, setClipList] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [visibleRows, setVisibleRows] = useState([]);
  const observer = useRef(null);
  const settingsTextRef = useRef(null);
  const initialRef = useRef(null);
  const finalRef = useRef(null);

  const updateClipList = (result) => {
    const res = JSON.parse(result);
    if (res) {
      setClipList(res);
      setFilteredData(res);
    }
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

  const handleKeyDown = (event) => {
    if (event.keyCode >= 48 && event.keyCode <= 57) {
      const itemAtIndex = filteredData[event.key]
      copyContent(itemAtIndex.content);
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    EventsOn("Backend:GlobalHotkeyEvent", globalHotkeyEventHandler);

    clipData();
  }, []);

  function globalHotkeyEventHandler(time) {
    window.runtime.WindowShow();
  }

  function clipData() {
    GetClipData("none").then(updateClipList);
    const onCopyEvent = (message) => {
      GetClipData("none").then(updateClipList);
    };
    window.runtime.EventsOn("copy_event", onCopyEvent);
  }

  function copyItem(e, itemContent) {
    e.preventDefault();
    copyContent(itemContent);
    return false;
  }

  function copyContent(itemContent) {
    CopyItemContent(itemContent);
    toast({ description: "Copied!", duration: 500 });
    window.runtime.WindowHide();
  }

  function markSecret(e, item) {
    e.preventDefault();
    EventsEmit("mark_secret", item.hash);
    toast({ description: "Marked secret!", duration: 500 });
    window.location.reload();
    return false;
  }

  function quit(e) {
    e.preventDefault();
    console.log("quit...");
    EventsEmit("menu_quit", true);
    return false;
  }

  function settings(e) {
    e.preventDefault();
    console.log("settings...");
    onOpen();

    setTimeout(() => {
      const settingsText = localStorage.getItem("settings");
      if (settingsText && settingsTextRef.current) {
        settingsTextRef.current.value = settingsText;
      }
    }, 1);
    return false;
  }

  function clear(e) {
    e.preventDefault();
    console.log("clear...");
    EventsEmit("menu_clear", true);
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
    let str = item.content;
    if (!str) {
      return str;
    }

    if (item.is_secret) {
      str = str.trim().replace(/ /g, "");
      return str.slice(0, 3) + "******";
    }

    if (str.length > 40) {
      str = str.trim().replace(/ /g, " ");
      return str.slice(0, 30) + "...";
    }
    return str;
  }

  function onSettingSave(e) {
    const settingsText = settingsTextRef.current.value;
    localStorage.setItem("settings", settingsText);
    onClose();
  }

  function quickCopyIndexes(index) {
    if (index > 9) {
      return null;
    }

    return (
      <Text pt="2" fontSize="xs" as="i" color="#666666">
        <span
          style={{
            marginLeft: "5px",
            borderRadius: "5px",
            padding: "2px",
            border: "0.5px solid #ddd"
          }}
        >
          {index}
        </span>
      </Text>
    );
  }
  return (
    <>
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
                icon={<HamburgerIcon />}
                style={{ marginLeft: "5px" }}
                variant="outline"
              />
              <MenuList>
                <MenuItem onClick={(e) => clear(e)}>Clear</MenuItem>
                <MenuItem onClick={(e) => settings(e)}>Settings</MenuItem>
                <MenuItem onClick={(e) => about(e)}>About</MenuItem>
                <MenuItem onClick={(e) => quit(e)}>Quit</MenuItem>
              </MenuList>
            </Menu>
          </Flex>
        </CardHeader>

        <CardBody style={{ padding: "10px" }}>
          <Stack spacing="2">
            {filteredData.map((itm, indx) => (
              <Box key={itm.hash} data-index={indx}>
                <Flex>
                  <Text
                    pt="2"
                    fontSize="sm"
                    flex="1"
                    style={{ textAlign: "left" }}
                  >
                    {clearStr(itm)}
                  </Text>
                  <Text pt="2" fontSize="xs" color="#999999">
                    {new Date(itm.timestamp).toISOString()}
                  </Text>

                  {quickCopyIndexes(indx)}

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

      <Modal
        initialFocusRef={initialRef}
        finalFocusRef={finalRef}
        isOpen={isOpen}
        onClose={onClose}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Settings</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Textarea ref={settingsTextRef} placeholder="Settings yaml" />
          </ModalBody>

          <ModalFooter>
            <Button colorScheme="blue" onClick={onSettingSave} mr={3}>
              Save
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

export default App;
