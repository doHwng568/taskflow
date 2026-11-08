import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class PasswordGenerator {

    public static void main(String[] args) {

        BCryptPasswordEncoder encoder =
                new BCryptPasswordEncoder();

        String password = "Dung@123456";

        String hashedPassword = encoder.encode(password);

        System.out.println("Password: " + password);
        System.out.println("BCrypt: " + hashedPassword);
    }
}