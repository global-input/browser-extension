import React,{useState} from 'react';
import ContentOnComputer from './ContentOnComputer';
    
enum PAGES{
    CONTENT_ON_COMPUTER,
    CONTENT_ON_MOBILE,
    START_ENCRYPT
};
interface MobileEncryptionProps {
    domain:string;
    back: ()=>void;
}
const MobileEncryption:React.FC<MobileEncryptionProps> = ({domain,back})=>{
    const [page,setPage]=useState(PAGES.CONTENT_ON_COMPUTER);    
    switch(page){
            case PAGES.CONTENT_ON_COMPUTER:
                    return(<ContentOnComputer back={back}/>);
            case PAGES.CONTENT_ON_MOBILE:

            
    }
    return null;
};


export default MobileEncryption;