### ลบแบบ Soft Delete
```sh
export const deleteUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  await User.destroy({ where: { id } });
  res.json({ message: 'User soft-deleted' });
};
```

### ดูผู้ใช้ทั้งหมด (จะไม่เห็น user ที่ถูก soft delete)
```sh
export const getUsers = async (req: Request, res: Response) => {
  const users = await User.findAll();
  res.json(users);
};
```

### Restore ผู้ใช้
```sh
export const restoreUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  await User.restore({ where: { id } });
  res.json({ message: 'User restored' });
};
```