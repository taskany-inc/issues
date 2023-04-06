import { createGlobalStyle } from 'styled-components';
import { backgroundColor, fontDisplay, textColor } from '@taskany/colors';

export const GlobalStyle = createGlobalStyle`
    html, body {
        box-sizing: border-box;

        font-family: ${fontDisplay};
        color: ${textColor};

        margin: 0;
        padding: 0;

        width: 100%;
        height: 100%;

        background-color: ${backgroundColor};
        --background-color-context: ${backgroundColor};
    }
`;
