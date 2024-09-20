import * as XLSX from 'xlsx'

// PERCENTAGE

const percentage = (num, perc) => {
    return (num / 100) * perc
}

// CONSTANTES

let dataArr = [];
let energyArr = [];
let staticArr = [];
let energyNamesOrder = [];
const nominal = 220;
const MinNom = percentage(nominal, 70);
const penaltyAmount = percentage(nominal, 8);
const dataLine = 5;
const minValidReadings = 480;

//COMMON FUNCTIONS

const resetLocalVars = () => {
    dataArr = [];
    energyArr = [];
    staticArr = [];
    energyNamesOrder = [];
}

const fetchFixedFile = () => {
    fetch('excel/CDP.xlsm').then(res => res.arrayBuffer()).then(ab => {
        const wb = XLSX.read(ab, { type: 'binary' });
        const sheetName = wb.SheetNames[1];
        const sheet = wb.Sheets[sheetName];
        const staticData = XLSX.utils.sheet_to_json(sheet);
        staticArr.push(staticData);
        const secondSheetName = wb.SheetNames[2];
        const secondSheet = wb.Sheets[secondSheetName];
        const secondStaticData = XLSX.utils.sheet_to_json(secondSheet);
        staticArr.push(secondStaticData);
    })
}

// MAIN MONOPHASIC FUNCTION

const processMonoData = async (energyFile, readingsData) => {
    resetLocalVars();
    fetchFixedFile();
    const warnings = [];

    const energyData = parseFileToJSON(energyFile, false, energyArr);

    const generateOutput = new Promise((res, rej) => {
        energyData.catch(ex => {
            rej(ex + 'Hubo un problema al leer el archivo de Energía Entregada (campo de la izquierda).')
        })
        const updateWaiter = setInterval(() => {
            if (energyArr.length !== 0 && staticArr.length !== 0) {
                clearInterval(updateWaiter);
                const orderedData = orderData(readingsData, energyArr);
                parseDataReadings(orderedData.orderedArr);
                if (readingsData.length !== energyArr[0].length) {
                    /*if (energyArr[0].length > readingsData.length) {
                        warnings.push('Existen más mediciones en el archivo excel (campo de la izquierda) que cantidad de archivos de datos (campo de la derecha).')
                    }*/
                    if (energyArr[0].length < readingsData.length) {
                        warnings.push('Existen menos mediciones en el archivo excel (campo de la izquierda) que cantidad de archivos de datos (campo de la derecha).')
                    }
                }
                if (orderedData.notInEnergyFile.length > 0) {
                    warnings.push(`No se encontraron los archivos para los códigos ENRE: ${orderedData.notInEnergyFile.map(code => `${code} ,`)}.`)
                }
                const outputFile = checkTotalMonoPenalty(orderedData, readingsData);
                res({
                    output: outputFile,
                    warnings
                })
            }
        }, 100)
    })

    return generateOutput
}

// MAIN TRIPHASIC FUNCTION
const processTriData = (readingsData) => {
    resetLocalVars();
    fetchFixedFile();
    const warnings = [];

    const generateOutput = new Promise((res, rej) => {
        parseDataReadings(readingsData, false);
        const updateWaiter = setInterval(() => {
            if (readingsData.length === dataArr.length && staticArr.length !== 0) {
                clearInterval(updateWaiter);
                const outputFile = checkTotalTriPenalty(dataArr);
                outputFile.then(r => {
                    res(r);
                }).catch(e => {
                    rej(e);
                })
            }
        }, 100)
    })
    return generateOutput
}


// FILTER, TRANSFORM & ARRANGE DATA

const orderData = (datalist, energyFile) => {
    const code = 'Codigo ENRE'
    const orderedArr = [];
    const notInEnergyFile = [];
    const dataKeys = Object.keys(datalist);
    const iterations = energyFile[0].length > dataKeys.length ? energyFile[0].length : dataKeys.length;
    dataKeys.forEach((key, ind) => {
        for (let i = 0; i < iterations; i++) {
            const fileCode = parseFileName(datalist[dataKeys[ind]].name)
            if (ind < energyFile[0].length) {
                if (fileCode === energyFile[0][i][code]) {
                    orderedArr.push(datalist[dataKeys[ind]])
                    energyNamesOrder.push(energyFile[0][i][code]);
                    break
                } else {
                    if (i === iterations) {
                        notInEnergyFile.push(energyFile[0][ind][code])
                    }
                }
            } else break
        }
    })
    return {
        orderedArr,
        notInEnergyFile
    }
}

const parseFileName = file => {
    const output = file.slice(0, file.indexOf('.'));
    return output
}

const parseDataReadings = async (data, monophasic = true) => {
    if (monophasic) {
        const dataArray = [];
        Object.keys(data).forEach(async e => {
            const parsed = await parseFileToJSON(data[e], true, dataArr)
            dataArray.push(parsed)
        });
    } else {
        const dataArray = [];
        Object.keys(data).forEach(async e => {
            const parsed = await parseFileToJSON(data[e], true, dataArr, monophasic);
        })
    }
}

const parseFileToJSON = async (e, mult = false, targ, monophasic) => {
    const reader = new FileReader();
    if (mult) {
        reader.readAsArrayBuffer(e)
    } else {
        reader.readAsArrayBuffer(e[0]);
    }
    reader.onload = p => {
        const data = p.target.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const parsedData = XLSX.utils.sheet_to_json(sheet);
        if (monophasic) {
            targ.push(parsedData)
        } else {
            targ.push({
                content: parsedData,
                ENRE: e.name
            })
        }
    }
}

// PENALIZACION INDIVIDUAL

const findMonoFormatKeys = arr => {
    let fecha, hora, UV, UVMax, UVMin, THDU, flicker, anorm;
    const currentKeys = Object.keys(arr[dataLine]);
    currentKeys.forEach(k => {
        switch (arr[dataLine][k]) {
            case 'THD U':
                THDU = k
                break;
            case 'Fecha':
                fecha = k
                break;
            case 'Hora':
                hora = k
                break;
            case 'U Max':
                UVMax = k
                break;
            case 'U Min':
                UVMin = k
                break;
            case 'U':
                UV = k
                break;
            case 'Flicker':
                flicker = k
                break;
            case 'Anormalidad':
                anorm = k
                break;
            default:
                break;
        }
    })
    const checkArr = [fecha, hora, UV, UVMax, UVMin,/* THDU, flicker,*/ anorm]
    if (checkArr.includes(undefined)) {
        return false
    } else {
        return {
            fecha,
            hora,
            UV,
            UVMax,
            UVMin,
            THDU,
            flicker,
            anorm
        }
    }
}

const findTriFormatKeys = arr => {
    let fecha, hora, U1, U2, U3, totalEA, anorm;
    const currentKeys = Object.keys(arr[dataLine]);

    const parseWattFormat = (format, key) => {
        let output;
        if (format.toLowerCase() === 'kwh') {
            output = {
                format: true,
                key
            }
        } else if (format.toLowerCase() === 'wh') {
            output = {
                format: false,
                key
            }
        }
        return output
    }

    currentKeys.forEach((key, ind) => {
        switch (arr[dataLine][key]) {
            case 'Fecha':
                fecha = key
                break;
            case 'Hora':
                hora = key
                break;
            case 'U1':
                U1 = key
                break;
            case 'U2':
                U2 = key
                break;
            case 'U3':
                U3 = key
                break;
            case 'EA Total':
                totalEA = parseWattFormat(arr[dataLine + 1][currentKeys[ind]], key)
                break;
            case 'Anormalidad':
                anorm = key
                break;

            default:
                break;
        }
    })
    const checkArr = [fecha, hora, U1, U2, U3, totalEA, anorm];
    if (checkArr.includes(undefined)) {
        return false
    } else {
        return {
            fecha,
            hora,
            U1,
            U2,
            U3,
            totalEA,
            anorm
        }
    }

}

const parseTime = time => {
    if (time) {
        const hour = parseInt(time.slice(0, time.indexOf(':')));
        const mins = parseInt(time.slice(time.indexOf(':') + 1, time.length));

        return (hour * 60 + mins)
    }
}

const checkTotalMonoPenalty = (arrObj, readings) => {
    const arr = arrObj.orderedArr;
    const missing = [];
    const totalkeys = Object.keys(readings);
    const processedFiles = [];
    const invalidFiles = [];
    const keys = Object.keys(arr);
    let totalPenalty = 0;

    totalkeys.forEach(e => {
        const name = parseFileName(readings[e].name);
        if (!energyNamesOrder.includes(name)) {
            missing.push(name)
        }
    })

    const finishedProcessing = new Promise((res, rej) => {
        keys.forEach((file, ind) => {
            const parsed = [];
            parseFileToJSON(arr[file], true, parsed);
            const fileName = parseFileName(arr[file].name);
            const timer = setInterval(() => {
                if (parsed.length === 1) {
                    const output = checkIndividualMonoPenalty(parsed[0], ind, fileName);
                    if (output === false) {
                        rej('Existen archivos con contenido inesperado. Proceso cancelado.')
                    }
                    if (output.valid && !output.empty) {
                        processedFiles.push(output);
                        totalPenalty += output.totalPenalty
                    } else {
                        invalidFiles.push(output)
                    }
                    clearInterval(timer)
                }
            }, 5)
        })

        const timer = setInterval(() => {
            const totalProcessed = processedFiles.length + invalidFiles.length
            if (totalProcessed === keys.length) {
                clearInterval(timer);
                //console.log(`Finished processing ${processedFiles.length + invalidFiles.length + missing.length} files, of which ${invalidFiles.length} are invalid and ${missing.length} are missing required data. The total penalty is $${totalPenalty}.`)
                res({
                    output: generateOutput(processedFiles, invalidFiles, missing),
                    penalty: totalPenalty
                });
            }
        }, 100)
    })

    return finishedProcessing
}

const checkTotalTriPenalty = data => {
    const processedFiles = [];
    const warnings = [];
    const invalidFiles = [];
    let totalPenalty = 0;

    const finishedProcessing = new Promise((res, rej) => {
        dataArr.forEach(arr => {
            const fileName = parseFileName(arr.ENRE);
            const individualOutput = checkIndividualTriPenalty(arr.content, fileName);
            if (individualOutput) {
                if (individualOutput.valid && !individualOutput.empty) {
                    processedFiles.push(individualOutput);
                    totalPenalty += individualOutput.totalPenalty;
                } else {
                    invalidFiles.push(individualOutput)
                }
            } else {
                warnings.push(data.ENRE)
            }
        })
        if (warnings.length === dataArr.length) {
            rej('Los archivos procesados no se corresponden al modelo Trifásico. Por favor verifique que los archivos que intenta procesar correspondan al formato seleccionado.')
        } else {
            res({
                warnings,
                output: generateOutput(processedFiles, invalidFiles),
                totalPenalty
            })
        }
    })
    return finishedProcessing
}

const checkIndividualMonoPenalty = (arr, fileInd, fileName) => {
    // AVAILABLE PARAMS { fecha, hora, UV, UVMax, UVMin, THDU, flicker, anorm }
    if (findMonoFormatKeys(arr) === false) {
        return false
    }
    const { fecha, hora, UV, UVMax, UVMin, THDU, flicker, anorm } = findMonoFormatKeys(arr);
    let normalRows = 0;
    let totalKi = 0;
    let totalV = 0;
    let totalPenalty = 0;
    let penaltyUnder = 0;
    let penaltyOver = 0;
    let ESMC = 0;
    let firstRegistryFlag = true;
    let firstRegistryDate;
    const deviantRows = [];
    const deliveredEnergy = getFileEnergy(fileInd);

    const filteredArr = arr.filter((row, ind) => {
        //Check for the Abnormality property
        if (row[anorm] !== "A" && ind >= dataLine) {
            //Check for 15 min interval
            let logDiff = parseTime(row[hora]) - parseTime(arr[ind - 1][hora]);

            //Check for instances under min nominal
            const parsedV = isOverMinNom(row, UV);
            if (!parsedV) {
                return false
            }
            //Check for 15 min interval
            if ((logDiff === 15 || logDiff === (-1425))) {
                //Check for penalizable readings
                if (parsedV > (nominal + penaltyAmount) || parsedV < (nominal - penaltyAmount)) {
                    //console.log(typeof(parsedV))
                    const deviancy = getDeviancy(parsedV, nominal + penaltyAmount < parsedV);
                    const deviancyParams = getMonoDeviancyParams(parsedV, row[hora], fileName);
                    if (!deviancyParams) {
                        return false
                    }
                    const deviantArrObj = {
                        deviancy,
                        deviancyParams,
                        row,
                        penalty: null
                    }
                    deviantRows.push(deviantArrObj);
                    if (deviancy > 0) {
                        penaltyOver++
                    } else {
                        penaltyUnder++
                    }
                }
                //Add to filter + add to relevant values
                normalRows++
                const coef = getMonoTimeCoef(row[hora], findRow(fileName));
                if (!coef) {
                    return false
                }
                totalKi = totalKi + coef
                totalV = totalV + parsedV
                if (firstRegistryFlag) {
                    firstRegistryFlag = false;
                    firstRegistryDate = `${row[hora]} ${row[fecha]}`
                }
                return true
            }
        }
        return false
    });

    const isPenalizable = deviantRows.length > percentage(normalRows, 3);

    deviantRows.forEach(row => {
        const energy = (row.deviancyParams.timeCoef / totalKi) * deliveredEnergy;
        ESMC += energy;
        if (isPenalizable) {
            totalPenalty = totalPenalty + (row.deviancyParams.deviancyCoef * energy);
        }
    })

    if (normalRows >= minValidReadings) {
        const outputObj = {
            ENRE: energyNamesOrder[fileInd],
            valid: true,
            filteredArr,
            deviantRows,
            totalPenalty,
            penaltyOver,
            penaltyUnder,
            fileInd,
            isPenalizable,
            ESMC,
            deliveredEnergy,
            totalRegistries: arr.length - dataLine - 2,
            firstRegistryDate,
            lastRegistryDate: `${filteredArr[filteredArr.length - 1][hora]} ${filteredArr[filteredArr.length - 1][fecha]}`,
            empty: false
        }
        return outputObj
    } else {
        return {
            ENRE: energyNamesOrder[fileInd],
            valid: false,
            empty: false
        }
    }
}

const checkIndividualTriPenalty = (arr, ENRE) => {
    if (!findTriFormatKeys(arr)) {
        return false
    }
    const { fecha, hora, U1, U2, U3, totalEA, anorm } = findTriFormatKeys(arr);
    const warnings = [];
    const deviantRows = [];

    let totalPenalty = 0;
    let firstRegistryFlag = true;
    let firstRegistryDate;
    let penaltyOver = 0;
    let penaltyUnder = 0;
    let normalRows = 0;
    let ESMC = 0;
    let deliveredEnergy = 0;

    const triCurrentEnergy = (value, format) => {
        /* if (format) {
            return parseFloat(value / 1000)
        } else {
            return parseFloat(value / 1000)
        } */
        return parseFloat(value / 1000)
    }

    const filteredArr = arr.filter((row, ind) => {
        //Check for the Abnormality property
        if (row[anorm] !== "A" && ind >= dataLine) {
            //Check for instances under min nominal
            const parsedV = isOverMinNom(row, { U1, U2, U3 });
            if (!parsedV) {
                return false
            }

            //Check for 15 min interval
            let logDiff = parseTime(row[hora]) - parseTime(arr[ind - 1][hora]);
            if ((logDiff === 15 || logDiff === (-1425))) {
                const currentEnergy = triCurrentEnergy(row[totalEA.key], totalEA.format);
                normalRows++;
                deliveredEnergy += currentEnergy;
                //Check for penalizable readings
                const penalizedReading = isTriReadingPenalized({ row, U1, U2, U3 });
                if (penalizedReading) {
                    const deviancy = getDeviancy(penalizedReading, (nominal + penaltyAmount) < penalizedReading);
                    if (deviancy) {
                        deviantRows.push({
                            value: penalizedReading,
                            deviancy,
                            energy: currentEnergy,
                            time: row[hora]
                        })
                        if (deviancy > 0) {
                            penaltyOver++
                        } else {
                            penaltyUnder++
                        }
                    }
                }
                if (firstRegistryFlag) {
                    firstRegistryDate = `${row[hora]} ${row[fecha]}`
                }
                return true
            }
        }
    })
    const isPenalizable = deviantRows.length > percentage(normalRows, 3);
    if (isPenalizable) {
        deviantRows.forEach(row => {
            const deviancyCoef = getDeviancyCoef(row.deviancy);
            ESMC += row.energy;
            if (deviancyCoef) {
                totalPenalty += row.energy * deviancyCoef
            } else {
                warnings.push(`No se encontro el coeficiente de desvio.`);
            }
        })
    }
    if (normalRows >= minValidReadings) {
        return {
            ENRE,
            valid: true,
            filteredArr,
            deviantRows,
            totalPenalty,
            penaltyOver,
            penaltyUnder,
            isPenalizable,
            ESMC,
            deliveredEnergy,
            totalRegistries: arr.length - dataLine - 2,
            firstRegistryDate,
            lastRegistryDate: `${filteredArr[filteredArr.length - 1][hora]} ${filteredArr[filteredArr.length - 1][fecha]}`,
            empty: false
        }

    } else {
        return {
            ENRE,
            valid: false,
            empty: false
        }
    }
}

const isOverMinNom = (row, nomKey) => {
    if (typeof (nomKey) !== 'object') {
        let formattedNum = row[nomKey].toString();
        if (row[nomKey] > 250) {
            if (formattedNum.length > 4) {
                formattedNum = formattedNum.slice(0, formattedNum.length - 2) + '.' + formattedNum.slice(formattedNum.length - 2);
            } else {
                formattedNum = formattedNum.slice(0, formattedNum.length - 1) + '.' + formattedNum.slice(formattedNum.length - 1);
            }
        }
        parseFloat(formattedNum);
        if (formattedNum <= MinNom) {
            return false
        } else {
            return formattedNum
        }
    } else {
        const outputObj = {};
        //nomKey en este caso tiene de estructura {U1: U1Key, U2: U2Key, U3: U3Key, ...}
        for (let key in nomKey) {
            let formattedNum = row[nomKey[key]].toString();
            if (row[nomKey[key]] > 250) {
                if (formattedNum.length > 4) {
                    formattedNum = formattedNum.slice(0, formattedNum.length - 2) + '.' + formattedNum.slice(formattedNum.length - 2);
                } else {
                    formattedNum = formattedNum.slice(0, formattedNum.length - 1) + '.' + formattedNum.slice(formattedNum.length - 1);
                }
            }
            if (formattedNum > MinNom) {
                outputObj[key] = parseFloat(formattedNum);
            } else {
                return false
            }
        }
        return outputObj
    }
}

const getDeviancy = (v, OU) => {
    let output = null;
    if (OU) {
        if (v >= nominal + percentage(nominal, 8) && v < nominal + percentage(nominal, 9)) {
            output = 8
        }
        if (v >= nominal + percentage(nominal, 9) && v < nominal + percentage(nominal, 10)) {
            output = 9
        }
        if (v >= nominal + percentage(nominal, 10) && v < nominal + percentage(nominal, 11)) {
            output = 10
        }
        if (v >= nominal + percentage(nominal, 11) && v < nominal + percentage(nominal, 12)) {
            output = 11
        }
        if (v >= nominal + percentage(nominal, 12) && v < nominal + percentage(nominal, 13)) {
            output = 12
        }
        if (v >= nominal + percentage(nominal, 13) && v < nominal + percentage(nominal, 14)) {
            output = 13
        }
        if (v >= nominal + percentage(nominal, 14) && v < nominal + percentage(nominal, 15)) {
            output = 14
        }
        if (v >= nominal + percentage(nominal, 15) && v < nominal + percentage(nominal, 16)) {
            output = 15
        }
        if (v >= nominal + percentage(nominal, 16) && v < nominal + percentage(nominal, 17)) {
            output = 16
        }
        if (v >= nominal + percentage(nominal, 17) && v < nominal + percentage(nominal, 18)) {
            output = 17
        }
        if (v >= nominal + percentage(nominal, 18)) {
            output = 18
        }
    } else {
        if (v <= nominal - percentage(nominal, 8) && v > nominal - percentage(nominal, 9)) {
            output = -8
        }
        if (v <= nominal - percentage(nominal, 9) && v > nominal - percentage(nominal, 10)) {
            output = -9
        }
        if (v <= nominal - percentage(nominal, 10) && v > nominal - percentage(nominal, 11)) {
            output = -10
        }
        if (v <= nominal - percentage(nominal, 11) && v > nominal - percentage(nominal, 12)) {
            output = -11
        }
        if (v <= nominal - percentage(nominal, 12) && v > nominal - percentage(nominal, 13)) {
            output = -12
        }
        if (v <= nominal - percentage(nominal, 13) && v > nominal - percentage(nominal, 14)) {
            output = -13
        }
        if (v <= nominal - percentage(nominal, 14) && v > nominal - percentage(nominal, 15)) {
            output = -14
        }
        if (v <= nominal - percentage(nominal, 15) && v > nominal - percentage(nominal, 16)) {
            output = -15
        }
        if (v <= nominal - percentage(nominal, 16) && v > nominal - percentage(nominal, 17)) {
            output = -16
        }
        if (v <= nominal - percentage(nominal, 17) && v > nominal - percentage(nominal, 18)) {
            output = -17
        }
        if (v <= nominal - percentage(nominal, 18)) {
            output = -18
        }
    }
    return output
}

const findRow = fileName => {
    return energyArr[0].filter(row => row['Codigo ENRE'] === fileName)[0];
}

const getMonoDeviancyParams = (v, time, fileName) => {
    const energyRow = findRow(fileName);
    const deviancy = getDeviancy(v, v > nominal + penaltyAmount);
    const staticKeysEnergy = Object.keys(energyArr[0][0]);
    const deviancyCoef = getDeviancyCoef(deviancy);
    const timeCoef = getMonoTimeCoef(time, energyRow);
    if (!timeCoef) {
        return false
    }
    const energyData = {
        rate: energyRow[staticKeysEnergy[1]],
        energy: energyRow[staticKeysEnergy[2]]
    }
    const output = {
        deviancyCoef,
        timeCoef,
        energyData
    }
    return output;
}

const getFileEnergy = fileInd => {
    const energyObj = energyArr[0].filter(line => line['Codigo ENRE'] === energyNamesOrder[fileInd]);

    return energyObj[0]['Energía [kWH]'];
}

const getMonoTimeCoef = (time, energyRow) => {
    const formattedTime = formatTime(time);
    const staticKeysTime = Object.keys(staticArr[0][0]);
    const staticKeysEnergy = Object.keys(energyArr[0][0]);
    const timeCoefArr = staticArr[0].filter(row => {
        const rowTime = formatTime(row[staticKeysTime[0]]);
        return rowTime === formattedTime
    });
    const typeInd = staticKeysTime.indexOf(energyRow[staticKeysEnergy[1]]);
    if (typeInd === -1) {
        return false
    }
    const timeCoef = timeCoefArr[0][staticKeysTime[typeInd]];
    return timeCoef
}

const formatTime = time => {
    const ind = time.indexOf(':');

    if (ind > 1) {
        return time.slice(0, 2);
    } else {
        return '0' + time.slice(0, 1);
    }
}

const getDeviancyCoef = deviancy => {
    const staticKeysV = Object.keys(staticArr[1][0]);
    const deviancyCoefArr = staticArr[1].filter(row => row[staticKeysV[0]] === Math.abs(deviancy / 100));
    const deviancyCoef = deviancyCoefArr[0][staticKeysV[1]];
    return deviancyCoef
}

const isTriReadingPenalized = info => {
    const { row, U1, U2, U3 } = info;
    const parsedU1 = isOverMinNom(row, U1);
    const parsedU2 = isOverMinNom(row, U2)
    const parsedU3 = isOverMinNom(row, U3)
    let highestDeviancyArr = [];

    if (parsedU1 > (nominal + penaltyAmount) || parsedU1 < (nominal - penaltyAmount)) {
        if (parsedU1 > (nominal + penaltyAmount)) {
            highestDeviancyArr.push({
                value: parsedU1,
                deviancy: parsedU1 - (nominal + penaltyAmount)
            })
        }
        if (parsedU1 < (nominal - penaltyAmount)) {
            highestDeviancyArr.push({
                value: parsedU1,
                deviancy: (nominal - penaltyAmount) - parsedU1
            })
        }
    }
    if (parsedU2 > (nominal + penaltyAmount) || parsedU2 < (nominal - penaltyAmount)) {
        if (parsedU2 > (nominal + penaltyAmount)) {
            highestDeviancyArr.push({
                value: parsedU2,
                deviancy: parsedU2 - (nominal + penaltyAmount)
            })
        }
        if (parsedU2 < (nominal - penaltyAmount)) {
            highestDeviancyArr.push({
                value: parsedU2,
                deviancy: (nominal - penaltyAmount) - parsedU2
            })
        }
    }
    if (parsedU3 > (nominal + penaltyAmount) || parsedU3 < (nominal - penaltyAmount)) {
        if (parsedU3 > (nominal + penaltyAmount)) {
            highestDeviancyArr.push({
                value: parsedU3,
                deviancy: parsedU3 - (nominal + penaltyAmount)
            })
        }
        if (parsedU3 < (nominal - penaltyAmount)) {
            highestDeviancyArr.push({
                value: parsedU3,
                deviancy: (nominal - penaltyAmount) - parsedU3
            })
        }
    }
    if (highestDeviancyArr.length === 0) {
        return false
    } else {
        highestDeviancyArr.sort((a, b) => b.deviancy - a.deviancy);
        return highestDeviancyArr[0].value;
    }
}

// EXCEL OUTPUT

const generateOutput = (rows, invalid = [], missing = []) => {

    const formattedRows = rows.map(row => prepareForOutput(row))
    invalid.forEach(obj => {
        formattedRows.push(prepareForOutput(obj))
    })
    missing.forEach(name => {
        formattedRows.push(prepareForOutput({
            ENRE: name,
            empty: true
        }))
    })
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(formattedRows);
    XLSX.utils.sheet_add_aoa(worksheet, [["NRO ENRE", "Medición Válida", "Medición Penalizada", "Registros Totales", "Registros Válidos", "Registros Penalizados", "Registros con Sobre Tensión", "Registros con Baja Tensión", "Energía SMC [kWh]", "Penalización [AR$]", "Energía Entregada [kWh]", "Semestre", "Fecha Procesamiento"]], { origin: "A1" });
    XLSX.utils.book_append_sheet(workbook, worksheet, "Output");
    worksheet["!cols"] = [];
    const max_width = formattedRows.reduce((w, r) => Math.max(w, "Registros con Sobre Tensión".length), 10);
    for (let i = 0; i < Object.keys(formattedRows[0]).length; i++) {
        worksheet["!cols"].push({ wch: max_width });
    }

    return workbook
}

const prepareForOutput = row => {
    // NRO_ENRE VALIDO DESVIOxLINEA(menos de 3% pones 1) RES521-24

    let NRO_ENRE, Medicion_Valida, Medicion_Penalizada, Registros_Totales, Registros_Validos, Registros_Penalizados, Registros_con_sobretension, Registros_con_baja_tension, Energia_SMC, Penalizacion, Energia_Entregada, Semestre, d, currentDate

    if (!row.empty) {
        if (row.valid) {
            if (row.isPenalizable) {
                NRO_ENRE = row.ENRE;
                Medicion_Valida = 'Verdadero';
                Medicion_Penalizada = 'Verdadero';
                Registros_Totales = row.totalRegistries;
                Registros_Validos = row.filteredArr.length;
                Registros_Penalizados = row.deviantRows.length;
                Registros_con_sobretension = row.penaltyOver;
                Registros_con_baja_tension = row.penaltyUnder;
                Energia_SMC = row.ESMC;
                Penalizacion = row.totalPenalty;
                Energia_Entregada = row.deliveredEnergy;
                Semestre = '';
                d = new Date();
                currentDate = [d.getDate(), d.getMonth(), d.getFullYear()]
            } else {
                NRO_ENRE = row.ENRE;
                Medicion_Valida = 'Verdadero';
                Medicion_Penalizada = 'Falso';
                Registros_Totales = row.totalRegistries;
                Registros_Validos = row.filteredArr.length;
                Registros_Penalizados = '-';
                Registros_con_sobretension = '-';
                Registros_con_baja_tension = '-';
                Energia_SMC = '-';
                Penalizacion = '-';
                Energia_Entregada = '-';
                Semestre = '';
                d = new Date();
                currentDate = [d.getDate(), d.getMonth(), d.getFullYear()]
            }
        } else {
            NRO_ENRE = row.ENRE;
            Medicion_Valida = 'Falso';
            Medicion_Penalizada = 'Falso';
            Registros_Totales = '-';
            Registros_Validos = '-';
            Registros_Penalizados = '-';
            Registros_con_sobretension = '-';
            Registros_con_baja_tension = '-';
            Energia_SMC = '-';
            Penalizacion = '-';
            Energia_Entregada = '-';
            Semestre = '-';
            d = new Date();
            currentDate = [d.getDate(), d.getMonth(), d.getFullYear()]
        }
    } else {
        NRO_ENRE = row.ENRE;
        Medicion_Valida = '-';
        Medicion_Penalizada = '-';
        Registros_Totales = '-';
        Registros_Validos = '-';
        Registros_Penalizados = '-';
        Registros_con_sobretension = '-';
        Registros_con_baja_tension = '-';
        Energia_SMC = '-';
        Penalizacion = '-';
        Energia_Entregada = 'Sin Datos';
        Semestre = '-';
        d = new Date();
        currentDate = [d.getDate(), d.getMonth(), d.getFullYear()]
    }

    const output = {
        NRO_ENRE,
        Medicion_Valida,
        Medicion_Penalizada,
        Registros_Totales,
        Registros_Validos,
        Registros_Penalizados,
        Registros_con_sobretension,
        Registros_con_baja_tension,
        Energia_SMC,
        Penalizacion,
        Energia_Entregada,
        Semestre,
        Fecha_Procesamiento: `${currentDate[0]}/${currentDate[1] + 1}/${currentDate[2]}`,
    }

    return output
}

const printWorkbook = wb => {
    XLSX.writeFile(wb, "output.xlsx", { compression: true });
}

// EXPORT

export { processMonoData, processTriData, printWorkbook }