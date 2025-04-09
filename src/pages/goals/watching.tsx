import { GoalsPage } from '../../components/GoalsPage/GoalsPage';
import { declareGoalsSsrProps } from '../../utils/declareGoalsSsrProps';

export const getServerSideProps = declareGoalsSsrProps();

export default GoalsPage;
