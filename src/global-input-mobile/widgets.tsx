import React, { useEffect, useState, MouseEvent } from "react";
import styled from "styled-components";
import { QRCodeSVG } from "qrcode.react";
import { ConnectQR, PairingQR } from 'global-input-react';
import { WidgetState, MobileData } from "./commons";
import settingsImage from "./images/settings.png";
import connectImage from "./images/connect.png";
import disconnectImage from "./images/disconnect.png";
import pairingImage from "./images/pairing.png";
import { SettingsEditor } from "./settingsEditor";
import * as globalInputConfig from "global-input-config";



const Button = styled.button`
  text-decoration: none;
  font-size: 15px;
  border-radius: 8px;
  color: #4281bd;
  background-color: white;
  white-space: nowrap;

  padding: 15px;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  border: none;
  display: flex;
  min-width: 50px;

  max-width: 300px;
  margin-left: 5px;
  margin-right: 5px;
  transition: all 0.3s ease 0s;
  cursor: pointer;
  font-weight: 700;

  &: hover {
    background-color: #e3e3e3;
  }
`;

const BigButton = styled(Button)`
  border-width: 0;
  font-size: 15px;
`;
const DarkButton = styled(BigButton)`
  background-color: rgb(208, 226, 247);
  &: hover {
    background-color: rgb(188, 206, 217);
  }
`;

const Container = styled.div`
  flex-direction: column;
  justify-content: flex-center;
  align-items: flex-start;
  margin: 0;
  padding: 0;
  display: flex;
  background-color: white;
  padding: 20px;
  border-radius: 12px 12px 0 0;  
  width: 100%;
  @media screen and (min-width: 800px) {
    border-radius: 12px;
  }
`;

const TopBar = styled.div`
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  justify-content: space-between;
  width: 100%;
  align-items: flex-end;
`;
const Content = styled.div`
  flex-direction: column;
  justify-content: flex-center;
  align-items: center;
  margin: 0;
  padding: 0;
  display: flex;
  width: 100%;
  overflow: scroll;
  position: relative;
`;

const PopupGlass = styled.div`
  display: flex;
  margin: 0;
  padding: 0;
  position: fixed;
  z-index: 10;
  width: 100vw;
  height: 100vh;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  top: 0;
  left: 0;
  animation: fadeIn 500ms cubic-bezier(0.230, 1.000, 0.320, 1.000);
  @media screen and (min-width: 800px) {
    justify-content: center;
  }

  @keyframes fadeIn {
    0% {
      opacity: 0;
      transform: scale(1.25);
      -webkit-transform: scale(1.25);
    }
    100% {
      opacity: 1;
      transform: scale(1.0);
      -webkit-transform: scale(1.0);
    }
 }
`;

const ErrorMessage = styled.div`
  color: white;
  font-size: 11px;
  padding: 6px;
  margin: 10px;
  border-radius: 12px;
  background-color: #ff8786;
  max-width: 350px;
  max-height: 100px;
  overflow: scroll;
`;

const BlueLink = styled.span`
  color: #0984e3;
  cursor: pointer;
  text-decoration: underline;
`;

const PopUpWindow = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
`;
export const CloseIcon = styled.button`
  position: absolute;
  cursor: pointer;
  color: white;
  border: none;
  border-radius: 50%;
  background-color: #ff6b6b;
  font-size: 40px;
  line-height: 0;
  font-weight: bold;
  display: inline-block;
  text-align: center;
  width: 45px;
  height: 45px;
  top: -60px;
  right: 15px;

  &:before {
    content: "×";
  }
`;

const TabContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
  margin-bottom: 12px;
`;
const TabBase = styled.div`
  border-radius: 30px;
  border-width: 0px;
  margin-right: 7px;
  margin-left: 7px;
  padding: 15px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 110px;
  height: 60px;
  align-items: center;
  cursor: pointer;
  &: hover {
    background-color: #efefef;
  }
`;
const ActiveTab = styled(TabBase).attrs({
  as: `button`,
})`
  background-color: #eeeeee;
`;
const Tab = styled(TabBase).attrs({
  as: `button`,
})`
  background-color: #dedede;
`;

const TabText = styled.div`
  color: #4872d3;
  font-size: 12px;
  font-weight: 600;
`;

const SettingsIcon = styled.img.attrs({
  src: settingsImage,
  alt: "Settings",
})`
  display: none;
  @media screen and (min-height: 530px) {
    display: block;
  }
`;
const PairingIcon = styled.img.attrs({
  src: pairingImage,
  alt: "Pair",
})`
  display: none;
  @media screen and (min-height: 530px) {
    display: block;
  }
`;

const ConnectIcon = styled.img.attrs({
  src: connectImage,
  alt: "Connect",
})`
  display: block;
  width: 22px;
  height: auto;
`;

const DisconnectIcon = styled.img.attrs({
  src: disconnectImage,
  alt: "Disconnect",
})`
  display: block;
  width: 22px;
  height: auto;
`;

const A = styled.span`
  color: #4872d3;
  text-decoration: underline;
  cursor: pointer;
  margin-left: 5px;
`;

const QRCodeOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,1,0,0.8);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;    
`;
const QRContainer = styled.div`
  background: rgba(255,255,255);
  padding: 20px;
  padding-bottom: 10px;
  border-radius: 1px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
`;
const QRCodeContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(255,255,255);
  border-radius: 1px;
  max-width: 300px;
  border-radius: 8px;    
`;

const QRInstruction = styled.div`
  color:   #4872d3;  
  font-size: 12px;
  padding-top: 20px;    
  padding-left: 10px;  
`;

const ScanInstruction = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  margin-top: 10px;
  margin-bottom: 10px;  
  color:   #4872d3;  
`;


const ButtonLike = styled.a`
  color: white;
  background-color:rgb(220, 228, 237);
  border: none;
  border-radius: 5px;
  padding: 2px 8px;
  font-size: inherit;
  text-decoration: none;
  cursor: pointer;
  display: inline-block;
  border: 1px dotted #ccc;
  color:   #4872d3;  
  margin-left: 5px;
  &:hover {
    background-color:rgb(186, 208, 232);
    
  }
`;
interface RegisteredInfo {
  session?: string;
  url?: string;
}

interface ClientAppLaunchedData {
  code: string;
  [key: string]: any;
}

const onQRCodeClicked=(code:string)=>{
  if (navigator &&  navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(code);
} else {
    const el = document.createElement('textarea');
    el.value = code;
    el.setAttribute('readonly', '');
    el.style.position = 'absolute';
    el.style.left = '-9999px';
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
}
}

interface TabProps {
  widgetState: WidgetState;
  setWidgetState: (widgetState: WidgetState) => void;
}
const SettingsTab: React.FC<TabProps> = ({ widgetState, setWidgetState }) => {
  if (widgetState === WidgetState.SETTINGS) {
    return (
      <ActiveTab>
        <SettingsIcon />
        <TabText>Settings</TabText>
      </ActiveTab>
    );
  } else {
    return (
      <Tab onClick={() => setWidgetState(WidgetState.SETTINGS)}>
        <SettingsIcon />
        <TabText>Settings</TabText>
      </Tab>
    );
  }
};

const ConnectTab: React.FC<TabProps> = ({ widgetState, setWidgetState }) => {
  if (widgetState === WidgetState.CONNECT_QR) {
    return (
      <ActiveTab>
        <ConnectIcon />
        <TabText>Connect</TabText>
      </ActiveTab>
    );
  } else {
    return (
      <Tab onClick={() => setWidgetState(WidgetState.CONNECT_QR)}>
        <ConnectIcon />
        <TabText>Connect</TabText>
      </Tab>
    );
  }
};

const PairingTab: React.FC<TabProps> = ({ widgetState, setWidgetState }) => {
  if (widgetState === WidgetState.PAIRING) {
    return (
      <ActiveTab>
        <PairingIcon />
        <TabText>Pair</TabText>
      </ActiveTab>
    );
  } else {
    return (
      <Tab onClick={() => setWidgetState(WidgetState.PAIRING)}>
        <PairingIcon />
        <TabText>Pair</TabText>
      </Tab>
    );
  }
};

const Tabs: React.FC<TabProps> = (props) => (
  <TabContainer>
    <ConnectTab {...props} />
    <SettingsTab {...props} />
    <PairingTab {...props} />
  </TabContainer>
);



function buildAppLaunchedMessage(mobile: {
  registeredInfo?: RegisteredInfo;
}): {
  url: string | null;
  code: string;
  session: string | undefined;
  globalInputUrl: string;
} {
  let globalInputUrl = globalInputConfig.getGlobalInputAppLaunchBaseURL();    
  const session = mobile.registeredInfo?.session;
  const code = Date.now().toString(36);
  let url = mobile.registeredInfo?.url;
  
  if (!session || !url) {
    return {
      url: null,
      code,
      session,
      globalInputUrl
    };
  }
  
  globalInputUrl += "&session=" + session;    
  globalInputUrl += "&code=" + code;
  globalInputUrl += "&url=" + encodeURIComponent(url);    
  
  return {
    url,
    code,
    session,
    globalInputUrl
  };
}

export interface ScanInstructionProps {
  onGlobalInputAppClick: () => void;
  variant?: 'link' | 'button';
}

export const AppScanInstruction: React.FC<ScanInstructionProps> = ({ 
  onGlobalInputAppClick,
  variant = 'button'
}) => (
  <ScanInstruction>
    Scan with 
    {variant === 'button' ? (
      <ButtonLike onClick={onGlobalInputAppClick}>
        Global Input App
      </ButtonLike>
    ) : (
      <A onClick={onGlobalInputAppClick}>
        Global Input App
      </A>
    )}
  </ScanInstruction>
);

export interface QROverlayProps {
  showOverlay: boolean;
  onOverlayClick: () => void;
  onContainerClick: (e: MouseEvent) => void;
  onClickCapture?: () => void;
  qrValue: string;
  qrSize?: number;
}

export const AppQROverlay: React.FC<QROverlayProps> = ({
  showOverlay,
  onOverlayClick,
  onContainerClick,
  onClickCapture,
  qrValue,
  qrSize = 250
}) => {
  if (!showOverlay) return null;
  
  return (
    <QRCodeOverlay onClick={onOverlayClick}>
      <QRCodeContainer>

      

      <QRInstruction onClick={onOverlayClick}>
        Scan the QR code below with your phone's camera to launch the Global Input App. Launching the app or clicking <ButtonLike>here</ButtonLike> will reveal the QR code for the app to scan.
      </QRInstruction>
      <QRContainer 
        onClick={onContainerClick} 
        onClickCapture={onClickCapture}
      >
        <QRCodeSVG value={qrValue} size={qrSize} />
      </QRContainer>
      <QRInstruction onClick={onOverlayClick}>        
        
      </QRInstruction>  
      </QRCodeContainer>    
    </QRCodeOverlay>
  );
};

interface ConnectWidgetProps {
  mobile: MobileData;
}

export const ConnectWidget: React.FC<ConnectWidgetProps> = ({ mobile }) => {
  const {
    widgetState,
    setWidgetState,
    errorMessage,
    onSaveSettings,
    loadSettings,
    restart,
    isConnected,
    isShowWidget,
    isConnectionDenied,
    isError,
    setClientAppLaunched
  } = mobile;
  
  const [showGlobalInputQRCode, setShowGlobalInputQRCode] = useState<boolean>(true);

  if (isConnected || !isShowWidget) {
    return null;
  }

  const handleGlobalInputAppClick = (): void => {
    setShowGlobalInputQRCode(true);
  };

  const handleOverlayClick = (): void => {
    setShowGlobalInputQRCode(false);
  };

  const stopPropagation = (e: MouseEvent): void => {
    e.stopPropagation();
  };

  const appLaunchedData = buildAppLaunchedMessage(mobile);  
  
  if (appLaunchedData.session) {    
    const onClientAppLaunched = (data: ClientAppLaunchedData): void => {
      if (data.code === appLaunchedData.code) {
        setShowGlobalInputQRCode(false);          
      }      
    };
    setClientAppLaunched(onClientAppLaunched);
  }

  return (
    <Container>
      <TopBar>
        <Tabs widgetState={widgetState} setWidgetState={setWidgetState} />
      </TopBar>
      <Content>
        {widgetState === WidgetState.CONNECT_QR && (
          <ConnectQR 
            mobile={mobile} 
            hspace={100} 
            label={
              !showGlobalInputQRCode && 
              <AppScanInstruction 
                onGlobalInputAppClick={handleGlobalInputAppClick}
                variant="button"
              />
            }
            onClickCode={onQRCodeClicked}
          />
        )}
        {widgetState === WidgetState.PAIRING && (
          <PairingQR 
            mobile={mobile} 
            hspace={100} 
            label={
              !showGlobalInputQRCode && 
              <AppScanInstruction 
                onGlobalInputAppClick={handleGlobalInputAppClick}
                variant="link"
              />
            }
          />
        )}
        {widgetState === WidgetState.SETTINGS && (
          <SettingsEditor
            saveSettings={onSaveSettings}
            loadSettings={loadSettings}
          />
        )}
        {isConnectionDenied && (
          <ErrorMessage>
            You can only use one mobile app per session. <BlueLink onClick={()=>restart()}>Click here</BlueLink> to start a new session.
          </ErrorMessage>
        )}
        {isError && errorMessage && (
          <ErrorMessage>{errorMessage}</ErrorMessage>
        )}
      </Content>
      <AppQROverlay
        showOverlay={showGlobalInputQRCode}
        onOverlayClick={handleOverlayClick}
        onContainerClick={stopPropagation}
        onClickCapture={() => {
          console.log('click capture');
          onQRCodeClicked(appLaunchedData.globalInputUrl);
        }}
        qrValue={appLaunchedData.globalInputUrl}
      />
    </Container>
  );
};

export const ConnectWindow: React.FC<ConnectWidgetProps> = ({ mobile }) => {
  const { isConnected, isShowWidget, setShowWidget } = mobile;
  
  useEffect(() => {
    let scrollDisabled = false;
    if (isShowWidget && !isConnected) {
      document.body.style.overflow = "hidden";
      scrollDisabled = true;
    }
    return () => {
      if (scrollDisabled) {
        document.body.style.overflow = "unset";
      }
    };
  }, [isConnected, isShowWidget]);

  if (!isShowWidget || isConnected) {
    return null;
  }

  return (
    <PopupGlass
      onClick={(e: MouseEvent<HTMLDivElement>) => 
        setShowWidget(e.target === e.currentTarget)
      }
    >
      <PopUpWindow>
        <ConnectWidget mobile={mobile} />
      </PopUpWindow>
    </PopupGlass>
  );
};
const ConnectLabel = styled.div`
  padding-left: 6px;
  font-size: 15px;
`;


interface ButtonProps {
  label?: string;
  skin?: string;
  mobile: MobileData;
  children?: React.ReactNode;
}
export const ConnectButton: React.FC<ButtonProps> = ({
  mobile,
  label = "Connect",
  skin  
}) => {
  const { setShowWidget, isConnected, isShowWidget } = mobile;
  
  if (isConnected || isShowWidget) {
    return null;
  }
  
  return skin === "white" ? (
    <BigButton onClick={() => setShowWidget(true)}>{label}</BigButton>
  ) : (
    <DarkButton onClick={() => setShowWidget(true)}>
      <ConnectIcon />
      <ConnectLabel>{label}</ConnectLabel>
    </DarkButton>
  );
};

export const DisconnectButton: React.FC<ButtonProps> = ({
  mobile,
  label = "Disconnect",
  skin,
  children
}) => {
  const { isConnected, isConnectionDenied, isDisconnected, restart } = mobile;
  
  if (!(isConnected || isConnectionDenied || isDisconnected)) {
    return null;
  }
  
  return skin === "white" ? (
    <BigButton onClick={(e: React.MouseEvent) => restart()}>{children || label || "Disconnect"}</BigButton>
  ) : (
    <DarkButton onClick={(e: React.MouseEvent) => restart()}>
      <DisconnectIcon />
      <ConnectLabel>{children || label || "Disconnect"}</ConnectLabel>
    </DarkButton>
  );
}

interface WhenProps {
  mobile: MobileData;
  children: React.ReactNode;
}

export const WhenConnected: React.FC<WhenProps> = ({ mobile, children }) => {
  return mobile.isConnected ? <>{children}</> : null;
};