import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, UserInstance } from '../models/user.model';
import { AppError } from '../middlewares/errorHandler';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';

// JWT Token Generation
const signToken = (id: string): string => {
  return jwt.sign({ id }, process.env.JWT_SECRET!, {
    expiresIn: '1d',
  });
};

// Refresh Token Generation
const signRefreshToken = (id: string): string => {
  return jwt.sign({ id }, process.env.JWT_SECRET!, {
    expiresIn: '7d',
  });
};

// Send tokens in response
const createSendToken = (user: UserInstance, statusCode: number, res: Response) => {
  const token = signToken(user.id!);
  const refreshToken = signRefreshToken(user.id!);

  // Save refresh token in database
  user.refreshToken = refreshToken;
  user.save();

  res.status(statusCode).json({
    status: 'success',
    token,
    refreshToken,
    expiresIn: 24 * 60 * 60, // 1 day in seconds
    data: {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    },
  });
};

// Configure Passport Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: '/api/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Find or create user
        const [user] = await User.findOrCreate({
          where: { googleId: profile.id },
          defaults: {
            email: profile.emails![0].value,
            firstName: profile.name?.givenName || '',
            lastName: profile.name?.familyName || '',
            role: 'patient', // Default role for Google OAuth users
          },
        });
        return done(null, user);
      } catch (error) {
        return done(error as Error);
      }
    }
  )
);

// Configure JWT Strategy
passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET!,
    },
    async (payload, done) => {
      try {
        const user = await User.findByPk(payload.id);
        if (!user) {
          return done(null, false);
        }
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password, firstName, lastName, role } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw new AppError('Email already exists', 400);
    }

    // Create user
    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      role: role as 'patient' | 'doctor',
    });

    // Send tokens
    createSendToken(user, 201, res);
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    // Check if email and password exist
    if (!email || !password) {
      throw new AppError('Please provide email and password', 400);
    }

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user || !(await user.comparePassword(password))) {
      throw new AppError('Incorrect email or password', 401);
    }

    // Send tokens
    createSendToken(user, 200, res);
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AppError('Please provide refresh token', 400);
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET!) as { id: string };

    // Find user with the refresh token
    const user = await User.findOne({
      where: { id: decoded.id, refreshToken },
    });

    if (!user) {
      throw new AppError('Invalid refresh token', 401);
    }

    // Send new tokens
    createSendToken(user, 200, res);
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('Invalid refresh token', 401));
    } else {
      next(error);
    }
  }
};

// Google OAuth handlers
export const googleAuth = passport.authenticate('google', {
  scope: ['profile', 'email'],
});

export const googleAuthCallback = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  passport.authenticate('google', { session: false }, (err, user: UserInstance | false) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return next(new AppError('Authentication failed', 401));
    }

    // Send tokens
    createSendToken(user, 200, res);
  })(req, res, next);
}; 