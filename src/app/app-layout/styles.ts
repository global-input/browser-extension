export default {
    title:{
        minWidth:100,
        minHeight:20,
        width:"100%",
        backgroundColor:"#153E85",
        color:"white",
        display:"flex",
        flexDirection:'row',
        justifyContent:"center",
        fontFamily: "Avenir",
        fontSize: 20,
        fontWeight: 100,
        whiteSpace: 'nowrap',
        paddingTop: 10,
        paddingBottom: 10,
        paddingLeft: 30,
        paddingRight: 30,
    },

    appContainer:{
        content:{
            minWidth:100,
            minHeight:100,
            display:"flex",
            flexDirection:"column" as 'column',
            justifyContent:"flex-start",
            alignItem:'center'
        },
        connectionMessage:{
            minWidth:500,
            minHeight:500,
            flexDirection:'column' as 'column',
            justifyContent:'start',
            alignItem:'center',

       },
       errorMessage:{
        width:"100%",
        color:"red",
        display:"flex",
        flexDirection:"row" as 'row',
        justifyContent:"flex-start",
        fontFamily: "Avenir",
        fontSize: 15,
        fontWeight: 100,
        padding: 10
     },
     message:{
        width:"100%",
        color:"#153E85",
        fontFamily: "Avenir",
        fontSize: 15,
        fontWeight: 100,
        padding: 10
     },
     footer:{
        color:"#153E85",
        fontSize: 16,
        fontWeight: 100,
        display:'flex',
        flexDirection:'row' as 'row',
        justifyContent:'space-between',
        alignItem:'end',
        width:"100%",
        padding:10,
        minWidth:"350px"
     }

     },




     domain:{
         width:"100%",
         fontFamily: "Avenir",
         fontSize: 16,
         paddingTop:10,
         fontWeight: 100,
         color:"#153E85",
         whiteSpace: 'nowrap' as 'nowrap',
         display:"flex",
         flexDirection:"row" as 'row',
         justifyContent:"center",


     },
    message:{
        container:{
            minWidth:300,
            minHeight:30,
            display:'flex',
            flexDirection:'column' as 'column',
            justifyContent:'center',
            alignItem:'center'
        },
        text:{
            width:"100%",
            color:"#153E85",
            fontFamily: "Avenir",
            fontSize: 14,
            fontWeight: 100,
            padding: 20,
            display:'block'
        },
        alink:{
            paddingLeft:4,
            paddingRight:4
        },
    },

    form:{
        container:{
            display:'flex',
            flexDirection:'column' as 'column',
            justifyContent:'start',
            alignItem:'start',
            width:"100%",
            minWidth:300,
        },
        fields:{
            display:'flex',
            flexDirection:'column' as 'column',
            justifyContent:'start',
            alignItem:'start',
            width:"100%",
            padding:10
        },
        footer:{
            display:'flex',
            flexDirection:'row' as 'row',
            justifyContent:'space-between',
            alignItem:'end',
            width:"100%",
            padding:10
        }
    }

};
