import React from 'react'

const Button = ({click, content, enabled=true, cl}) => {
  return (
    <button className={cl} disabled={!enabled} onClick={click}>{content}</button>
  )
}

export default Button