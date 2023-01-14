/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prefer-promise-reject-errors */
/* eslint-disable @typescript-eslint/consistent-type-assertions */
/* eslint-disable @typescript-eslint/return-await */
/* eslint-disable @typescript-eslint/no-useless-constructor */
import { doc, getDocs, collection, getDoc } from 'firebase/firestore'
// import { getStorage, ref, getDownloadURL, uploadBytes } from 'firebase/storage'
import { DataResponse, GenericItem } from '../types'
import { QuerySnapshot, SnapshotDocuments } from './firebaseMocks'
import { v4 } from 'uuid'
import db from '../config/firebase'
import { it, describe, expect, vi, afterEach, beforeAll } from 'vitest'
import { Multer } from 'multer'
import fs from 'fs/promises'
import color from 'colors'
// vi.mock('firebase/storage')
vi.mock('../node_modules/firebase/firestore')
const storage = vi.fn().mockResolvedValue({})
const ref = vi.fn().mockReturnValue('/welcome/')
const deleteDoc = vi.fn()
  .mockRejectedValueOnce('')
  .mockReturnValue(Promise.resolve())
const uploadBytes = vi.fn()
  .mockRejectedValueOnce('')
  .mockResolvedValue(Promise.resolve())

const setDoc = vi.fn()
  .mockRejectedValueOnce('')
  .mockReturnValue(Promise.resolve())

// afterEach(vi.clearAllMocks() as any)
// mockStorage.uploadBytes .
export class DataResponseClass implements DataResponse {
  data: GenericItem[]
  status: number
  statusText: string
  err: string
  ok: boolean
  constructor (data: GenericItem[], status: number, statusText: string, err: string, ok: boolean) {
    this.data = data
    this.status = status
    this.statusText = statusText
    this.err = err
    this.ok = ok
  }
}
interface IDao {
  addItem: (item: GenericItem) => Promise<DataResponse>
  getAll: () => Promise<DataResponse>
  getById: (id: string) => Promise<DataResponse>
  updateById: (id: string, item: GenericItem) => Promise<DataResponse>
  deleteById: (id: string) => Promise<DataResponse>
  uploadFile: (file: Express.Multer.File) => Promise<DataResponse>
}
export function DbManager (collectionStr: string): IDao {
  const collectionRef = collectionStr

  async function addItem (item: GenericItem): Promise<DataResponse> {
    const id = v4()
    if (!('render' in item.item)) return new DataResponseClass([], 400, 'Render is not in the item object', 'Bad Request', false)
    else {
      return await setDoc(doc(db, collectionRef, id), { ...item.item, id })
        .then(() => new DataResponseClass([{ ...item, id }], 201, 'Item successfully created ', '', true))
        .catch(() => new DataResponseClass([], 500, 'Failed to create the item', 'Failed conenection', false))
    }
  }

  async function getAll (): Promise<DataResponse> {
    return await getDocs(collection(db, collectionRef)).then(response => {
      const dataArray: any = []
      response.forEach(item => dataArray.push(item.data()))
      return new DataResponseClass(dataArray, 200, 'Information obtained', '', true)
    }).catch(err => new DataResponseClass([], 400, 'Couldnt Retrieve data', err.toString(), false))
  }

  async function getById (id: string): Promise<DataResponse> {
    if (typeof id !== 'string') return new DataResponseClass([], 400, 'Couldnt Retrieve data', 'ID is NOT a string', false)
    if (Object.prototype.toString.call(id) !== '[object String]') return new DataResponseClass([], 400, 'Couldnt Retrieve data', 'ID is NOT a string', false)
    const docRef = doc(db, collectionRef, id)
    const docs: GenericItem = await getDoc(docRef) as unknown as GenericItem
    const tempArray: GenericItem[] = []
    tempArray.push({ ...docs })
    if (docs !== undefined) return new DataResponseClass(tempArray, 200, 'Data retrived', '', true)
    return new DataResponseClass([], 400, 'Request failed', 'Document doesnt exists', false)
  }

  async function updateById (id: string, item: GenericItem): Promise<DataResponse> {
    if (Object.prototype.toString.call(item) !== '[object Object]') return new DataResponseClass([], 400, 'Item should be an object', 'Item is not an object', false)
    if (Object.prototype.toString.call(id) !== '[object String]') return new DataResponseClass([], 400, 'ID should be a string', 'Wrong ID', false)
    if (typeof id !== 'string') return new DataResponseClass([], 400, 'ID should be a string', 'Wrong ID', false)
    return await setDoc(doc(db, collectionRef, id), item)
      .then(() => new DataResponseClass([{ ...item, id }], 200, 'Item succesifuly updated', '', true))
      .catch(async (err: any) => Promise.reject(new DataResponseClass([], 400, 'setDoc Failed', err.toString(), false)))
  }

  async function deleteById (id: string): Promise<DataResponse> {
    if (typeof id !== 'string') return Promise.resolve(new DataResponseClass([], 400, 'ID should be a string', 'id is not a String', false))
    if (Object.prototype.toString.call(id) !== '[object String]') return Promise.resolve(new DataResponseClass([], 400, 'ID should be a string', 'id is not a String', false))
    return await deleteDoc(doc(db, collectionRef, id))
      .then(() => new DataResponseClass([], 400, 'Delete success', '', true))
      .catch(async (err: any) => Promise.reject(new DataResponseClass([], 200, 'Error procesing Database deleteDoc function', err as string, false)))
  }
  async function uploadFile (file: Express.Multer.File | undefined): Promise<DataResponseClass> {
    if (file?.path === undefined) return new DataResponseClass([], 400, 'The parameter should be a express.multer.file', 'Wrong param!!!', false)
    const buffer = await fs.readFile(file.path).then()
    const reference = ref(storage, `/${collectionRef}/${file.filename}`)
    try {
      console.log(await (uploadBytes(reference, buffer)))
      return new DataResponseClass([], 200, 'File uploaded succesfully', '', true)
    } catch (err) {
      return Promise.reject(new DataResponseClass([], 400, 'Error uploading file', err as string, false))
    }
  }

  return { addItem, getAll, getById, updateById, deleteById, uploadFile }
}

const dbManager = DbManager('welcome')
/// /////////////////////////////////////////
//                TESTS                   //
/// ////////////////////////////////////////

// describe('DbManager addItem tests', () => {
//   const setDoc = vi.fn().mockReturnValueOnce(Promise.resolve())
//   beforeEach(setDoc.mockClear())

//   it('addItem should be a function', () => {
//     expect(typeof dbManager.addItem).toBe('function')
//   })
//   it('should return false if render is not in the object', async () => {
//     expect(await dbManager.addItem({ item: { description: 'texto', title: 'texto' } } as GenericItem)).toContain({ ok: false })
//   })
//   it('Should return ok if render is present in the object', async () => {
//     expect(await dbManager.addItem({ item: { description: 'texto', title: 'titulo', render: true } } as GenericItem)).toContain({ ok: true } as unknown as GenericItem)
//   })
//   it('Expect setDoc to be called', async () => {
//     const cosa = await dbManager.addItem({ item: { render: true, description: 'Adrian' } } as GenericItem)
//     expect(setDoc).toHaveBeenCalled()
//     expect(cosa).toBeInstanceOf(DataResponseClass)
//   })
// })
// describe('DbManager getAll functions', () => {
//   const getDocs = vi.fn().mockReturnValue(Promise.resolve(new QuerySnapshot([new SnapshotDocuments(true, 'algo', 'titulo'), new SnapshotDocuments(true, 'algo mas', 'titulo 1'), new SnapshotDocuments(true, 'something', 'title'), new SnapshotDocuments(true, 'something else', 'titulo')])))
//   beforeEach(getDocs.mockClear())
//   it('Should be a function', () => {
//     expect(typeof dbManager.getAll).toBe('function')
//   })
//   it('Should call getDocs', async () => {
//     const respuesta = await dbManager.getAll()
//     expect(getDocs).toHaveBeenCalled()
//     expect(respuesta).toBeInstanceOf(DataResponseClass)
//   })
// })

// describe('DbManager getById', () => {
//   const getDoc = vi.fn().mockReturnValue(new SnapshotDocuments(true, 'algo lindo', 'Genial NO?'))
//   beforeEach(getDoc.mockClear())
//   it('Should contain false if id is not a string', async () => {
//     expect(await dbManager.getById(1 as any)).toContain({ ok: false })
//     expect(await dbManager.getById({} as any)).toContain({ ok: false })
//     expect(await dbManager.getById(true as any)).toContain({ ok: false })
//     expect(await dbManager.getById(NaN as any)).toContain({ ok: false })
//   })
//   it('Should return un valor truthy si param es tipo string', async () => {
//     const respuesta = await dbManager.getById('00637abb-40c2-4e04-bcd9-b395555ef99f')
//     expect(getDoc).toHaveBeenCalled()
//     expect(respuesta).toBeInstanceOf(DataResponseClass)
//   })
// })
describe('dbManager Update By ID Tests', async () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  it('Should return ok:false if setDocs is rejected', async () => {
    dbManager.updateById('texto', {} as any)
      .then((res) => console.log(color.bgGreen.white.bold('Resolved setDoc ')))
      .catch(err => {
        console.log(color.bgRed.white.bold('Rejected setDoc '))
        expect(err).toContain({ ok: false })
      })
  })
  it('Should return ok:false if setDocs is rejected', async () => {
    dbManager.updateById('texto', {} as any)
      .then((res) => {
        expect(res).toContain({ ok: true })
        console.log(color.bgGreen.white.bold('Resolved setDoc'))
      })
      .catch(err => {
        console.log(color.bgRed.white.bold('Rejected setDoc '))
        expect(err).toContain({ ok: false })
      })
  })

  it('Should contain false if id is not a string', async () => {
    expect(await dbManager.updateById(1 as any, undefined as any)).toContain({ ok: false })
    expect(await dbManager.updateById({} as any, undefined as any)).toContain({ ok: false })
    expect(await dbManager.updateById(true as any, undefined as any)).toContain({ ok: false })
    expect(await dbManager.updateById(NaN as any, undefined as any)).toContain({ ok: false })
  })
  it('Response should contain false if item is not an object', async () => {
    expect(await dbManager.updateById('00637abb-40c2-4e04-bcd9-b395555ef99f', undefined as any)).toContain({ ok: false })
    expect(await dbManager.updateById('00637abb-40c2-4e04-bcd9-b395555ef99f', 1 as any)).toContain({ ok: false })
    expect(await dbManager.updateById('00637abb-40c2-4e04-bcd9-b395555ef99f', true as any)).toContain({ ok: false })
  })
})

describe('dBManager deleteById function testing', async () => {
  it('Should return ok:false on reject', async () => {
    dbManager.deleteById('string id')
      .then(() => console.log(color.bgGreen.bold.black('DeleteDoc promise resolved ')))
      .catch((err) => {
        console.log(color.bgRed.white.bold('DeleteDoc Promise rejected'))
        expect(err).toContain({ ok: false })
      })
  })
  it('Should return ok:true on resolve', async () => {
    dbManager.deleteById('string id')
      .then((res) => {
        console.log(color.bgGreen.bold.black('DeleteDoc promise resolved'))
        expect(res).toContain({ ok: true })
      })
      .catch((err) => {
        console.log(color.bgRed.white.bold(`DeleteDoc Promise rejected ${err as string}`))
      })
  })
  it('Should return a false value when a not string value is passed', async () => {
    expect(await dbManager.deleteById(1 as any)).toContain({ ok: false })
    expect(await dbManager.deleteById({} as any)).toContain({ ok: false })
    expect(await dbManager.deleteById(NaN as any)).toContain({ ok: false })
    expect(await dbManager.deleteById(1 as any)).toContain({ ok: false })
  })
})

describe('uploadFile Tests', () => {
  it('Test Rejected State of upload Bytes', async () => {
    const file = { path: 'src/index.ts', filename: './src/index.ts' }
    dbManager.uploadFile(file as any)
      .then(() => console.log('resolved'))
      .catch(err => {
        console.log(color.bgRed.white.bold('uploadBytes Promise Rejected'))
        expect(err).toContain({ ok: false })
      })
  })
  it('Test Resolved State of uploadBytes', async () => {
    const file = { path: 'src/index.ts', filename: './src/index.ts' }
    dbManager.uploadFile(file as any)
      .then((response) => {
        console.log(color.bgGreen.white.bold('uploadBytes Promise Resolved'))
        expect(response).toContain({ ok: true })
      })
      .catch(err => console.log(color.bgRed.white.bold(`Promise rejected  ${err as string}`)))
  })
  it('should return a DataResponse false if arguments are not Multer File Object type', async () => {
    expect(await dbManager.uploadFile(1 as any)).toContain({ ok: false })
  })
})