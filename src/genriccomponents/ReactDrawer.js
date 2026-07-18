import React from 'react';
import { Drawer, Placeholder } from 'rsuite';
import 'rsuite/dist/rsuite-no-reset.min.css'; // Required RSuite CSS
 
const ReactDrawer = ({
  open,
  onClose,
  title = 'Details',
  // width = 400,
  children
}) => {
  return (
    <Drawer
      open={open}
      onClose={onClose}
      placement="right" // slides from right
      size="sm"
      backdrop="static"
      closeButton = {false}
      style={{ transition: 'transform 0.4s ease-in-out' }} // smooth slide
    >
      <Drawer.Header style={{padding: "0px"}}>
        <Drawer.Title style={{ fontSize: '18px', fontWeight: '600', color: '#0140c1' , padding: "15px 20px" , backgroundColor: "#f4f4f4" }}>
          {title}
        </Drawer.Title>
        {/* <Button appearance="subtle" onClick={onClose}>
          ✕
        </Button> */}
      </Drawer.Header>
 
      <Drawer.Body style={{ padding: '1rem' }}>
        {children || (
          <Placeholder.Paragraph rows={5} active />
        )}
      </Drawer.Body>
    </Drawer>
  );
};
 
export default ReactDrawer;