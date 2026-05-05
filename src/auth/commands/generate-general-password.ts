import { Command } from 'commander';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

const program = new Command();

program
  .name('generate:general-password')
  .description('Generate a general password hash for admin backup access')
  .option('-l, --length <number>', 'Password length', '16')
  .parse(process.argv);

const options = program.opts();
const length = parseInt(options.length, 10) || 16;

const rawPassword = randomBytes(Math.ceil(length / 2))
  .toString('base64')
  .slice(0, length)
  .replace(/\+/g, 'A')
  .replace(/\//g, 'Z')
  .replace(/=/g, '');

const hash = bcrypt.hashSync(rawPassword, 10);

console.log('\n========================================');
console.log('GENERAL PASSWORD GENERATED');
console.log('========================================\n');
console.log('Raw Password (use this to login):');
console.log(`  ${rawPassword}\n`);
console.log('Hash (add to .env as GENERAL_PASSWORD_HASH):');
console.log(`  ${hash}\n`);
console.log('========================================\n');
console.log('Example .env entry:');
console.log(`GENERAL_PASSWORD_HASH=${hash}\n`);
console.log('========================================\n');
