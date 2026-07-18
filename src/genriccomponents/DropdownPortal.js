import React from 'react'
import { createPortal } from 'react-dom';
 
const DropDownPortal = ({ children }) => {
   
   return createPortal(children, document.body);
 
}
 
export default DropDownPortal