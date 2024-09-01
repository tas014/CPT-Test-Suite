import React from 'react'
import { IoIosInformationCircleOutline } from "react-icons/io";

const Tooltip = () => {
  return (
    <article className='tooltip'>
        <IoIosInformationCircleOutline size={50} className='info'/>
        <div className='tooltip-text'>
            <div className='tooltip-container'>
                <h4>Instrucciones de Uso</h4>
                <div className='tooltip-divided'>
                    <div>
                        <h5>{'Energía de mediciones (campo izquierdo)'}</h5>
                        <ol>
                            <li>La primer columna del archivo debe contener el Número de Medición ENRE</li>
                            <li>
                                <label>La segunda columna del archivo debe contener la tarifa respetando los códigos:</label>
                                <ul>
                                    <li>T1R</li>
                                    <li>T1G</li>
                                    <li>T2</li>
                                    <li>T3BT</li>
                                </ul>
                            </li>
                            <li>{'La tercer columna del archivo debe contener la energía [kWH] registrada en el período [Valor entero o decimal].'}</li>
                            <li>Si no se especifica ningún valor para las dos primeras columnas o valores incorrectos, la medición no será procesada y en la salida de datos, se especificará <strong>“Sin Datos”</strong></li>
                        </ol>
                    </div>
                    <div>
                        <h5>{'Data (campo derecho)'}</h5>
                        <p>Deben colocarse aquí todos los archivos *.dat provenientes de los registradores de nivel de tensión monofásico a calcular. Si por error se incorporan otros formatos, éstos no serán tenidos en cuenta en el cálculo.</p>
                    </div>
                </div>
                <div className='tooltip-output'>
                    <h5>Output</h5>
                    <p>{'Una vez ingresados los archivos en ambos campos se activará el botón "Procesar Archivos", que iniciará el proceso para calcular las penalizaciones totales así como proveer de resultado una hoja de cálculos de formato excel ("output.xlsx") con los datos de cada archivo procesado para descargar.'}</p>
                </div>
            </div>
        </div>
    </article>
  )
}

export default Tooltip