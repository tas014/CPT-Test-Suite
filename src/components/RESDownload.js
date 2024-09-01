import React from 'react'
import Button from './Button'
import { stackData, printWb } from '../assets/readingsPrinter'
import { useState } from 'react'
import { VscLoading } from 'react-icons/vsc'

const RESDownload = ({ data }) => {
  const [processing, setProcessing] = useState(false);

  const handleCompactDownload = () => {
    const dat = stackData(data, false);
    dat.then(res => {
      console.log('Exito');
      printWb(res, false)
    }).catch(err => {
      console.log(`There was an error: ${err}`)
    });
  }
  const handleCompleteDownload = () => {
    const dat = stackData(data);
    dat.then(res => {
      console.log('Exito');
      printWb(res)
    }).catch(err => {
      console.log(`There was an error: ${err}`)
    });
  }

  return (
    <div className='RES-container flex just-between'>
      <h3 className='bold maxw'>Seleccione el formato a descargar</h3>
      <Button cl='bold RES-download' click={handleCompactDownload} content='Formato Compacto' />
      <Button cl='bold RES-download' click={handleCompleteDownload} content='Formato Completo' />
      {processing ? <VscLoading size={25} className='loadingIcon' /> : <span>Seleccione el formato que quiere descargar</span>}
    </div>
  )
}

export default RESDownload