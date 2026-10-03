import User from '../models/User.js';
import { signToken } from '../utils/token.js';

const send = (res, user, code = 200) =>
  res.status(code).json({
    token: signToken(user._id),
    user: { _id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role },
  });

export const register = async (req, res) => {
  const { name, email, password, phone } = req.body;
  if (await User.findOne({ email })) { res.status(400); throw new Error('Email already registered'); }
  // role is never taken from the request body
  const user = await User.create({ name, email, password, phone });
  send(res, user, 201);
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.matchPassword(password))) { res.status(401); throw new Error('Invalid email or password'); }
  send(res, user);
};

export const me = async (req, res) => res.json({ user: req.user });

export const updateProfile = async (req, res) => {
  const { name, phone, password } = req.body;
  const user = await User.findById(req.user._id).select('+password');
  if (name) user.name = name;
  if (phone !== undefined) user.phone = phone;
  if (password) user.password = password;
  await user.save();
  send(res, user);
};
