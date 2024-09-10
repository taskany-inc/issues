import { Text } from '@taskany/bricks/harmony';

export const BetaLiteral: React.FC<Pick<React.ComponentProps<typeof Text>, 'size'>> = ({ size }) => {
    return (
        <Text as="span" color="var(--brand-color)" size={size}>
            {String.fromCharCode(0x03b2)}
        </Text>
    );
};
