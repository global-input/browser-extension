import React,{useState,useCallback} from 'react';
import ContentOnComputer from './ContentOnComputer';
import ContentOnMobile from './ContentOnMobile';
import EncryptContent from './EncryptContent';
import ShowOnComputer from './ShowOnComputer';
enum PAGES{
    CONTENT_ON_COMPUTER,
    CONTENT_ON_MOBILE,
    START_ENCRYPT,
    SHOW_ON_COMPUTER,
    SHOW_ON_MOBILE

};
interface MobileEncryptionProps {
    domain:string;
    back: ()=>void;
}
const MobileEncryption:React.FC<MobileEncryptionProps> = ({domain,back})=>{
    const [page,setPage]=useState(PAGES.CONTENT_ON_COMPUTER);
    const [content,setContent]=useState('');
    const contentOnMobile=useCallback((content:string)=>{
        setContent(content);
        setPage(PAGES.CONTENT_ON_MOBILE);
    },[]);
    const contentOnComputer=useCallback((content:string)=>{
        setContent(content);
        setPage(PAGES.CONTENT_ON_COMPUTER);
    },[]);
    const startEncrypt=useCallback((content:string)=>{
        setContent(content);
        setPage(PAGES.START_ENCRYPT);
    },[]);
    const showOnComputer=(content:string)=>{
        setContent(content);
        setPage(PAGES.SHOW_ON_COMPUTER);

    }
    const showOnMobile=(content:string)=>{
        setContent(content);
        setPage(PAGES.CONTENT_ON_MOBILE);
    }

    switch(page){
            case PAGES.CONTENT_ON_COMPUTER:
                    return(<ContentOnComputer initialContent={content} cancel={back} contentOnMobile={contentOnMobile} startEncrypt={startEncrypt}/>);
            case PAGES.CONTENT_ON_MOBILE:
                    return (<ContentOnMobile initialContent={content} cancel={back} contentOnComputer={contentOnComputer} startEncrypt={startEncrypt}/>);
            case PAGES.START_ENCRYPT:
                    return (<EncryptContent content={content} showOnComputer={showOnComputer} />);
            case PAGES.SHOW_ON_MOBILE:


    }
    return null;
};


export default MobileEncryption;