import { SizeUnit, TdUploadFile } from './types';
import log from '../log/log';

/**
 * 各个单位和 KB 的关系
 *
 * [*] 表示方法采用这种方式
 * [x] 表示方法不采用这种方式
 *
 * [x] bit      位              b     0 or 1
 * [*] byte     字节            B     8 bits
 * [x] kilobit  千位            kb    1000 bites
 * [*] kilobyte 千字节(二进制)   KB    1024 bytes
 * [x] kilobyte 千字节(十进制)   KB    1000 bytes
 * [x] Megabite 百万位          Mb    1000 kilobits
 * [*] Megabyte 兆字节(二进制)   KB    1024 kilobytes
 * [*] Megabyte 兆字节(十进制)   KB    1000 kilobytes
 * [x] Gigabit  万亿位          Gb    1000 Megabite
 * [*] Gigabyte 吉字节(二进制)   GB    1024 Megabytes
 * [x] Gigabyte 吉字节(十进制)   GB    1000 Megabytes
 */
export const SIZE_MAP = {
  B: 1,
  KB: 1024,
  MB: 1048576, // 1024 * 1024
  GB: 1073741824, // 1024 * 1024 * 1024
};

export function returnFileSize(number: number) {
  if (number < SIZE_MAP.B) {
    return `${number} Bytes`;
  }
  if (number >= SIZE_MAP.B && number < SIZE_MAP.MB) {
    return `${(number / SIZE_MAP.B).toFixed(1)} KB`;
  }
  if (number >= SIZE_MAP.MB) {
    return `${(number / SIZE_MAP.MB).toFixed(1)} MB`;
  }
  return '';
}

export function getCurrentDate() {
  const d = new Date();
  let month: string | number = d.getMonth() + 1;
  month = month < 10 ? `0${month}` : month;
  return `${d.getFullYear()}-${month}-${d.getDate()} ${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}`;
}

/**
 * 缩略文件名 ABCDEFG => ABC...FG
 * @param inputName 文件名
 * @param leftCount 左边长度
 * @param rightCount 右边长度
 * @returns 缩略后的文件名
 */
export function abridgeName(
  inputName: string,
  leftCount = 5,
  rightCount = 7
): string {
  const name = inputName;
  let leftLength = 0;
  let rightLength = 0;
  if (!name) return '';
  for (let i = 0; i < name.length; i++) {
    const w = name[i];
    const isCn = escape(w).indexOf('%u') === 0;
    if (i < leftCount * 2 && leftLength < leftCount) {
      // eslint-disable-next-line no-unused-expressions
      isCn ? (leftLength += 1) : (leftLength += 2);
    } else if (i > i - rightCount && rightLength < rightCount) {
      // eslint-disable-next-line no-unused-expressions
      isCn ? (rightLength += 1) : (rightLength += 2);
    }
  }
  return name.replace(
    new RegExp(`^(.{${leftLength}})(.+)(.{${rightLength}})$`),
    '$1…$3'
  );
}

export function getFileSizeText(number: number) {
  if (number < 1024) {
    return `${number} Bytes`;
  }
  if (number >= 1024 && number < 1048576) {
    return `${(number / 1024).toFixed(1)} KB`;
  }
  if (number >= 1048576) {
    return `${(number / 1048576).toFixed(1)} MB`;
  }
  return '';
}

/**
 * 大小比较
 * @param size 文件大小，单位：B
 * @param unit 计算机计量单位
 */
export function isOverSizeLimit(
  fileSize: number,
  sizeLimit: number,
  unit: SizeUnit
) {
  const units = ['B', 'KB', 'MB', 'GB'];
  const KBIndex = 1;
  let index = units.indexOf(unit);
  if (index === -1) {
    log.warn('Upload', `\`sizeLimit.unit\` can only be one of ${units.join()}`);
    index = KBIndex;
  }
  const num = SIZE_MAP[unit];
  return fileSize > sizeLimit * num;
}

export const urlCreator = () => window.webkitURL || window.URL;

/**
 *
 * @param files 待处理文件
 * @param format 格式化规则
 */
export function formatFiles(
  files: File[] = [],
  format?: (file: File) => TdUploadFile
) {
  return files.map((fileRaw) => {
    const file = typeof format === 'function' ? format(fileRaw) : fileRaw;
    const uploadFile: TdUploadFile = {
      raw: fileRaw,
      lastModified: fileRaw.lastModified,
      name: fileRaw.name,
      size: fileRaw.size,
      type: fileRaw.type,
      percent: 0,
      status: 'waiting',
      ...file,
    };
    uploadFile.url = urlCreator()?.createObjectURL(fileRaw);
    return uploadFile;
  });
}

export function getFileUrlByFileRaw(fileRaw: File): Promise<string> {
  return new Promise((resolve) => {
    if (!fileRaw) {
      resolve('');
      return;
    }
    const reader = new FileReader();
    reader.readAsDataURL(fileRaw);
    reader.onload = (event: ProgressEvent<FileReader>) => {
      resolve(event.target.result as string);
    };
  });
}
