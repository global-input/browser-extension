import React from 'react';
import "bootstrap/dist/css/bootstrap.min.css";


interface Props {
  disabled?: boolean;
  label: string;
  onClick?: () => void;
}

const TextButton: React.FC<Props> = ({ label = "Ok", disabled, onClick }) => {
  if (disabled) {
    return (<button style={styles.disabled} disabled={true}>{label}</button>);
  }
  else {
    return (<button style={styles.enabled} onClick={onClick}>{label}</button>);
  }
};

var styles = {
  enabled: {
    backgroundColor: "#5291CD",
    borderRadius: 5,
    margin: "5vw",
    color: "white",
    padding: 10,
    minWidth: 150,
  },
  disabled: {
    backgroundColor: "#888888",
    color: "white",
    borderRadius: 8,
    border: "3px solid #888888",
    margin: "5vw"
  }

};
export default TextButton;