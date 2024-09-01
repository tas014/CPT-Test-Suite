import React from 'react'

const Modal = ( { hideComponent, children } ) => {
  return (
    <div className='output-container' onClick={hideComponent}>
        {children}
    </div>
  )
}

export default Modal