import bcrypt from 'bcryptjs';

async function testHashes() {
    const hashPablo = "$2b$10$XZQDnCKUg91KU4P/Mrfmze8yazeobHAMBkpn/1uxhOcs2ZNV4Mubm";
    const hashJuan = "$2b$10$iD8IJb/c.djo7wCteiojEO0r1kINOC1SaFfN4nbMc8XRv2lgdwf.u";
    const defaultResidentSvcHash = "$2b$10$EpRnTzVlqHNP0.fKb.U/..t.Chq.GT/Oe";

    const pass1 = '123456';
    const pass2 = 'password';
    const pass3 = '12345678';
    const pass4 = '123456789';

    console.log('Pablo = 123456?', await bcrypt.compare(pass1, hashPablo));
    console.log('Juan = 123456?', await bcrypt.compare(pass1, hashJuan));
    console.log('DefaultSvc = 123456?', await bcrypt.compare(pass1, defaultResidentSvcHash));
}

testHashes();
