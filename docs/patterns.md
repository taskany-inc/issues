# Patterns

## Naming

### Components

#### All components in `src/components`

Just as a standard in most projects in the world.

#### `src/components` flat as long as possible

It means no directories for components. Is your component needs extra modules, think twice and try to reuse this logic somewhere else. If it's possible, please use `src/utils`.
If you have wish about moveout styles into extra module don't worry about that. This situation means you have too large component, try to separate it.

#### First part of filename contains entity name

Ex: `Issue`, `IssueHeader`, `ProjectCompletion` and etc. It helps to see groups of components wich connected to same entity automatically.

### Source

#### No abstract names for interfaces

⚠️ Incorrect:
``` ts
interface Props {}

export const MyComponent: React.FC<Props> = (props) => { /* ... */ };
```

✅ Correct:

``` ts
interface MyComponentProps {}

export const MyComponent: React.FC<MyComponentProps> = (props) => { /* ... */ };
```

#### Mark styled components with `Styled` prefix

⚠️ Incorrect:
``` ts
const Wrapper = styled.div``;

export const MyComponent: React.FC<MyComponentProps> = (props) => <Wrapper />;
```

✅ Correct:
``` ts
const StyledWrapper = styled.div``;

export const MyComponent: React.FC<MyComponentProps> = (props) => <StyledWrapper />;
```

#### No uppercase and snakecase for constants

All constants are variables. If you want to mark some variable you can always use comments.

⚠️ Incorrect:
``` ts
const REFRESH_INTERVAL = 2000;
```

✅ Correct:
``` ts
/* Global constant for data updates with SWR */
const refreshInterval = 2000;
```
