import React,{useState} from 'react';
import PageControl from './PageControl';


enum PAGES{
    PAGE_CONTROL,
    SETTING,
};
interface Props {
    domain:string;
    back: ()=>void;
}
const PageControlHome:React.FC<Props> = ({domain,back})=>{
    const [page,setPage]=useState(PAGES.PAGE_CONTROL);

    switch(page){
        case PAGES.PAGE_CONTROL:
            return <PageControl back={back} domain={domain}/>
        default:
    }
    return null;
};


export default PageControlHome;