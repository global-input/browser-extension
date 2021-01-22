import styled,{keyframes} from 'styled-components';

const spin=keyframes`
0% { transform: rotate(0deg); }
100% { transform: rotate(360deg); }
`;

export const Spinner=styled.div`
border: 16px solid #f3f3f3;
border-radius: 50%;
border-top: 16px solid #3498db;
width: 30px;
height: 30px;
align-self:center;
-webkit-animation: ${spin} 2s linear infinite; /* Safari */
animation: ${spin} 2s linear infinite;

`;
