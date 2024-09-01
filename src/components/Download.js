import React from 'react'

const Download = ({enable=false, handleClick}) => {
  return (
    <button className='bold' onClick={handleClick} disabled={!enable}>{!enable ? 'Suba los archivos para comenzar...' : 'Procesar Archivos'}</button>
  )
}

export default Download