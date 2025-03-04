export class Strategy {
  name: string;

  constructor() {
    this.name = 'jwt';
  }
}

export const ExtractJwt = {
  fromAuthHeaderAsBearerToken: () => (req: any) => req.headers?.authorization?.replace('Bearer ', ''),
};

export default {
  Strategy,
  ExtractJwt,
}; 