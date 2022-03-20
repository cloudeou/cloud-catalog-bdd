const fs = require('fs');
import { Logger } from '../../logger/Logger';
import { ArrayUtils } from './ArrayUtils';

const logger = new Logger();
export class FileSystem {
  async deleteFile(filePath) {
    fs.unlink(filePath, (err) => {
      //if (err) throw err;
      logger.verbose(`Successfully deleted file: ${filePath}`);
    });
  }

  async deleteFolder(folderPath) {
    fs.rmdir(folderPath, { recursive: false }, (err) => {
      //if (err) throw err;
      logger.verbose(`Successfully deleted folder: ${folderPath}`);
    });
  }

  static readFileSync(filePath) {
    return fs.readFileSync(filePath, (err) => {
      //if (err) throw err;
      logger.verbose(`Successfully read file: ${filePath}`);
    });
  }

  static deleteFolderRecursivelySync(folderPath) {
    fs.rmdirSync(folderPath, { recursive: true }, (err) => {
      //if (err) throw err;
      logger.verbose(
        `Successfully deleted folder(s) recursively: ${folderPath}`,
      );
    });
  }

  static fileExistsSync(filePath) {
    return fs.existsSync(filePath);
  }

  static async deleteFolderRecursively(folderPath) {
    fs.rmdir(folderPath, { recursive: true }, (err) => {
      //if (err) throw err;
      logger.verbose(
        `Successfully deleted folder(s) recursively: ${folderPath}`,
      );
    });
  }

  async createFolder(folderPath) {
    logger.verbose(`Creating folder: ${folderPath}`);
    fs.mkdir(folderPath, { recursive: false }, (err) => {
      //if (err) throw new Error(err);
      logger.verbose(`Successfully created folder: ${folderPath}`);
    });
  }

  async createFolderRecursively(folderPath) {
    fs.mkdir(folderPath, { recursive: true }, (err) => {
      //if (err) throw err;
      logger.verbose(
        `Successfully created folder(s) recursively: ${folderPath}`,
      );
    });
  }

  static createFolderRecursivelySync(folderPath) {
    fs.mkdirSync(folderPath, { recursive: true });
    logger.verbose(`Successfully created folder(s) recursively: ${folderPath}`);
  }

  async renameFile(srcFile, tgtFile) {
    fs.rename(srcFile, tgtFile, (err) => {
      //if (err) throw err;
      logger.verbose('renamed complete');
    });
  }

  static getFiles(folderPath) {
    const lf = fs.readdirSync(folderPath);
    const files = ArrayUtils.removeNullAndUndefinedElements(lf);

    return files;
  }
}
