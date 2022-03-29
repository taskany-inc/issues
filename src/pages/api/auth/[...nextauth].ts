import NextAuth from 'next-auth';

import { authOptions } from '../../../utils/auth';

export default NextAuth(authOptions);
