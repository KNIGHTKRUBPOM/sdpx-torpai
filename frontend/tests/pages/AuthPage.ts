import type { Page } from '@playwright/test'

export class AuthPage {
  constructor(private readonly page: Page) {}
  async openLogin() { await this.page.goto('/login') }
  async openRegister() { await this.page.goto('/register') }
  async login(email: string, password: string) {
    await this.page.getByLabel('Email').fill(email)
    await this.page.getByLabel('Password').fill(password)
    await this.page.getByRole('button', { name: 'เข้าสู่ระบบ' }).click()
  }
  async register(input: { studentId: string; name: string; email: string; password: string }) {
    await this.page.getByLabel('รหัสนักศึกษา').fill(input.studentId)
    await this.page.getByLabel('ชื่อ-นามสกุล').fill(input.name)
    await this.page.getByLabel('Email').fill(input.email)
    await this.page.getByLabel('Password').fill(input.password)
    await this.page.getByRole('button', { name: 'สมัครสมาชิก' }).click()
  }
}
