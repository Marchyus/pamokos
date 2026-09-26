import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@mantine/core/styles.css'
import { MantineProvider, createTheme } from '@mantine/core'
import App from './App.tsx'

const theme = createTheme({
  primaryColor: 'gray', // Muted buttons
  colors: {
    dark: [
      '#d5d7e0', // text color (softer white)
      '#acaebf',
      '#8c8fa3',
      '#666980',
      '#4d4f66',
      '#34354a', // border color
      '#2b2c3d', // card background (lighter dark)
      '#212230', // lighter body background
      '#1c1d29',
      '#13141c',
    ],
  },
  components: {
    Button: {
      defaultProps: {
        variant: 'light', // Makes buttons look softer and more muted
      },
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MantineProvider defaultColorScheme="dark" theme={theme}>
      <App />
    </MantineProvider>
  </StrictMode>,
)
