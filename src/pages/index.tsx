import { HomePage } from '../components/HomePage/HomePage';
import { declareSsrProps } from '../utils/declareSsrProps';

export const getServerSideProps = declareSsrProps();

export default HomePage;
