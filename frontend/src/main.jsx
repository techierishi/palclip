import React from 'react'
import {createRoot} from 'react-dom/client'
import './style.css'
import App from './App'
import { ChakraProvider } from '@chakra-ui/react'

const container = document.getElementById('root')

const root = createRoot(container)

root.render(
    <ChakraProvider>
        <React.StrictMode>
            <App/>
        </React.StrictMode>
    </ChakraProvider>
)
