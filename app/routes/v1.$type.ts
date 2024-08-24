import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { api } from '~/.server/api';

export function loader(args: LoaderFunctionArgs) {
	return api.fetch(args.request);
}

export function action(args: ActionFunctionArgs) {
	return api.fetch(args.request);
}
