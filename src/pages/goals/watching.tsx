import { GoalsPage } from '../../components/GoalsPage/GoalsPage';
import { declareGoalsSsrProps } from '../../utils/declareGoalsSsrProps';

export const getServerSideProps = declareGoalsSsrProps({
    watching: true,
});

export default GoalsPage;
